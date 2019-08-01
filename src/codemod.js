/* eslint-disable no-param-reassign */
import j from 'jscodeshift';
import { getSource } from './codemod.helper';

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// templateFn.call(this, { ... })
const isTemplateWithThis = (p, templateFuncs) =>
  p.node.callee.object && templateFuncs.indexOf(p.node.callee.object.name) !== -1 &&
  p.node.callee.property && p.node.callee.property.name === 'call';

// templateFn({ ... })
const isTemplateWithoutThis = (p, templateFuncs) =>
  !p.node.callee.object && !p.node.callee.property &&
  templateFuncs.indexOf(p.node.callee.name) !== -1;

const compareVariables = (a, b) => {
  const nameA = a.key.name.replace(/^unused_/, '');
  const nameB = b.key.name.replace(/^unused_/, '');
  const priorityA = nameA.search(/^[A-Z]/) !== -1 ? 1 : 0;
  const priorityB = nameB.search(/^[A-Z]/) !== -1 ? 1 : 0;
  if (priorityA === priorityB) {
    if (nameA === nameB) {
      return 0;
    }
    return nameA > nameB ? 1 : -1;
  }
  return priorityA > priorityB ? 1 : -1;
};

const getLinkedJsFiles = (files) => {
  const linkedJsFiles = glob.sync(path.join(files.path, '*.{js,jsx,ts,tsx}'))
    .filter(file => file.search('.pug.transpiled.jsx') === -1)
    .map((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const templateFuncs = getSource(content, file)
        .find(j.ImportDeclaration)
        .nodes()
        .filter((e) => {
          if (e.specifiers && e.specifiers.length === 1 &&
            e.source.value.search('./') === 0 &&
            path.join(files.path, e.source.value) === path.join(files.path, files.pug)
          ) {
            return true;
          }
          return false;
        })
        .map(e => e.specifiers[0].local.name);
      return { file, content, templateFuncs };
    })
    .filter(e => e.templateFuncs.length > 0);
  return linkedJsFiles;
};


const codemod = ({ useThis, variables }, resourcePath) => {
  try {
    const filePath = resourcePath.split(path.sep).join('/');
    const files = {
      path: filePath.replace(/\/[^/]+$/, ''),
      pug: `./${filePath.replace(/\.[a-zA-Z0-9]+$/, '').split('/').pop()}.pug`,
    };

    const printOptions = {
      quote: 'single',
      trailingComma: true,
    };

    const jsFiles = getLinkedJsFiles(files);

    jsFiles.forEach(({ file, content, templateFuncs }) => {
      let commentRemoved = content;
      getSource(content, file)
      .find(j.CallExpression)
      .filter(ce =>
        isTemplateWithThis(ce, templateFuncs) || isTemplateWithoutThis(ce, templateFuncs),
      )
      .forEach((ce) => {
        const templateFuncName = ce.node.callee.object ?
          ce.node.callee.object.name : ce.node.callee.name;

        commentRemoved = commentRemoved.replace(new RegExp(`${templateFuncName}(.call)?\\([\\s\\S]+?}\\);`, 'g'), whole =>
          whole.replace(/\/\/.*?\n/g, '\n'));
      });

      const breadcrumbs = {};

      const root = getSource(commentRemoved, file)
      .find(j.CallExpression)
      .filter(ce =>
        isTemplateWithThis(ce, templateFuncs) || isTemplateWithoutThis(ce, templateFuncs),
      )
      .forEach((ce) => {
        const withThis = isTemplateWithThis(ce, templateFuncs);

        const templateFuncName = ce.node.callee.object ?
          ce.node.callee.object.name : ce.node.callee.name;

        let variableExists = false;
        let componentExists = false;
        let properties = (((ce.node.arguments || [])[withThis ? 1 : 0] || {}).properties || [])
          .map((p) => {
            const pureName = p.key.name.replace(/^unused_/, '');
            if (variables.indexOf(pureName) !== -1) {
              p.key.name = pureName;
            } else if (variables.indexOf(p.key.name) === -1) {
              p.key.name = `unused_${pureName}`;
            }
            delete p.comments;
            return p;
          });

        const oldVars = properties.map(p => p.key.name);

        properties = [
          ...properties,
          ...variables
            .filter(p => oldVars.indexOf(p) === -1)
            .map(e => j.objectProperty(
                j.identifier(e),
                j.identifier(e),
              )),
        ]
          .sort(compareVariables)
          .map((p) => {
            if (!variableExists && p.key.name.search(/^[A-Z]/) === -1) {
              p.comments = [j.commentLine(' variables')];
              variableExists = true;
            }
            if (!componentExists && p.key.name.search(/^[A-Z]/) !== -1) {
              p.comments = [j.commentLine(' components')];
              componentExists = true;
            }
            if (p.value.type === 'JSXElement') {
              const jsxCode = j(p.value).toSource().trim();
              // Wrap jsx code with parenthesis: keep
              if (jsxCode.search(/^\(/) === -1) {
                const key = `jsx__${Math.random().toString(36).substr(-6)}`;
                breadcrumbs[key] = jsxCode;
                p.value = j.literal(key);
              }
            }
            p.shorthand = p.key.name === p.value.name;
            return p;
          });
        if (useThis) {
          ce.node.callee = j.memberExpression(
            j.identifier(templateFuncName),
            j.identifier('call'),
          );
          ce.node.arguments = [
            j.thisExpression(),
            (properties.length > 0 ? j.objectExpression(properties) : null),
          ].filter(e => e);
        } else {
          ce.node.callee = j.identifier(templateFuncName);
          ce.node.arguments = [
            (properties.length > 0 ? j.objectExpression(properties) : null),
          ].filter(e => e);
        }
      });

      // Wrap jsx code with parenthesis: write down
      let result = Object.keys(breadcrumbs)
      .reduce((prev, key) =>
        prev.replace(new RegExp(`\n(\\s+)(.*?):\\s+'${key}'`), (whole, p1, p2) =>
          `\n${p1}${p2}: (\n${breadcrumbs[key].split('\n').map(e => `${p1}  ${e}`).join('\n')}\n${p1})`)
      , root.toSource(printOptions));

      templateFuncs.forEach((templateFunc) => {
        result = result.replace(new RegExp(`${templateFunc}(.call)?\\([\\s\\S]+?}\\);`, 'g'), whole =>
        whole.replace(/\n\s*\n/g, '\n'));
      });

      if (result !== content) {
        fs.writeFileSync(file, result, 'utf8');
      }
    });
  } catch (err) {
    console.error(err);
  }
};

export default codemod;
