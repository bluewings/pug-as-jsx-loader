const fs = require('fs');
const path = require('path');
const glob = require('glob');
const j = require('jscodeshift');

const isReactElement = node =>
  node.parent.parent.node.type === 'JSXElement' && node.node.name.search(/^[a-z]/) === 0;

// templateFn.call(this, { ... })
const isTemplateWithThis = (p, templateFuncs) =>
  p.node.callee.object && templateFuncs.indexOf(p.node.callee.object.name) !== -1 &&
  p.node.callee.property && p.node.callee.property.name === 'call';

// templateFn({ ... })
const isTemplateWithoutThis = (p, templateFuncs) =>
  !p.node.callee.object && !p.node.callee.property &&
  templateFuncs.indexOf(p.node.callee.name) !== -1;

const arrayUnique = myArray =>
  myArray.filter((v, i, a) => a.indexOf(v) === i);

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

const parseJsx = (jsxOutput, options = {}) => {
  const root = j(jsxOutput);

  const varsToIgnore = [
    ...(options.reservedWords || []),
    ...Object.keys(options.resolveComponents || {}),
    ...Object.keys(options.resolveVariables || {}),
    ...(options.importCss || []).map(e => e.name),
  ];

  // Remove the use of local parameters.
  root
    .find(j.ExportDefaultDeclaration)
    .find(j.ArrowFunctionExpression)
    .replaceWith((nodePath) => {
      // Get a list of function param names.
      const funcParamNames = j(nodePath.node.params)
        .nodes()
        .reduce((prev, param) => {
          if (param.type === 'ObjectPattern' && param.properties) {
            return [
              ...prev,
              ...param.properties
              .filter(p => p.key)
              .map(p => p.key.name),
            ];
          } else if (param.type === 'Identifier' && param.name) {
            return [
              ...prev,
              param.name,
            ];
          }
          return prev;
        }, []);

      nodePath.node.params = [];

      // Remove function parameter usage.
      j(nodePath.node.body)
        .find(j.MemberExpression)
        .filter((me) => {
          if (me.node.object && funcParamNames.indexOf(me.node.object.name) !== -1) {
            return true;
          }
          return false;
        })
        .remove();
      j(nodePath.node.body)
        .find(j.Identifier)
        .filter((p) => {
          const parentNodeType = p.parent.node.type;
          return parentNodeType !== 'JSXAttribute' &&
            parentNodeType !== 'MemberExpression' &&
            funcParamNames.indexOf(p.node.name) !== -1;
        })
        .remove();
      // console.log(j(nodePath).toSource());
      return nodePath.node;
    });


  // Remove this pattern: const { props1, props2 } = params;
  root
    .find(j.VariableDeclaration)
    .filter(p => p.node.declarations[0].init.name === 'params')
    .remove();

  const useThis = root
    .find(j.ExportDefaultDeclaration)
    .find(j.MemberExpression, {
      object: { type: 'ThisExpression' },
      property: { type: 'Identifier' },
    })
    .nodes().length > 0;

  // Get used variable names.
  let variables = [];
  root
    .find(j.ExportDefaultDeclaration)
    .forEach((nodePath) => {
      j(nodePath.node.declaration.body)
        .find(j.Identifier)
        .filter((p) => {
          if (p.parent.node.type === 'MemberExpression' &&
            p.parent.node.object === p.node
          ) {
            return true;
          }
          if (p.parent.node.type === 'JSXExpressionContainer' &&
            p.parent.node.expression === p.node
          ) {
            return true;
          }
          if (p.parent.node.type === 'Property' &&
            p.parent.parent.node.type === 'ObjectExpression' &&
            ['CallExpression', 'JSXExpressionContainer'].indexOf(p.parent.parent.parent.node.type) !== -1 &&
            p.parent.node.key === p.node
          ) {
            return false;
          }
          // exclude nested JSXElement. ex) Modal.Body
          if (p.parent.node.type === 'JSXMemberExpression' &&
            p.parent.node.property === p.node
          ) {
            return false;
          }
          return ['MemberExpression', 'JSXAttribute'].indexOf(p.parent.node.type) === -1 && !isReactElement(p);
        })
        .forEach((p) => {
          variables = [...variables, p.node.name];
        });
    });

  return {
    useThis,
    variables: arrayUnique(variables.filter(e => varsToIgnore.indexOf(e) === -1)).sort(),
  };
};

const getLinkedJsFiles = (files) => {
  const linkedJsFiles = glob.sync(path.join(files.path, '*.{js,jsx}'))
    .filter(file => file.search('.pug.transpiled.jsx') === -1)
    .map((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const templateFuncs = j(content)
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

module.exports = function (jsxOutput, files, options) {
  try {
    const printOptions = {
      quote: 'single',
      trailingComma: true,
    };

    const { useThis, variables } = parseJsx(jsxOutput, options);

    const jsFiles = getLinkedJsFiles(files);

    jsFiles.forEach(({ file, content, templateFuncs }) => {
      let commentRemoved = content;
      j(content)
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

      const root = j(commentRemoved)
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
