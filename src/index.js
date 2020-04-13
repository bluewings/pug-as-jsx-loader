import { pugToJsx } from 'pug-as-jsx-utils';
import { getOptions } from 'loader-utils';
import codemod from './codemod';

const fs = require('fs');
const path = require('path');

export default function loader(source) {
  const options = getOptions(this) || this;
  const { transform, pragma, autoFix } = options || {};
  const rootDir = (options || {}).rootDir || this.rootContext;
  const { resourcePath } = this;
  let resolve = {};
  if (options.resolve) {
    resolve = { ...options.resolve };
  } else {
    // for legacy props
    if (options.resolveComponents) {
      resolve = Object.entries(options.resolveComponents)
        .reduce((prev, [name, moduleName]) => ({
          ...prev,
          [moduleName]: { name },
        }), resolve);
    }
    if (options.resolveVariables) {
      resolve = Object.entries(options.resolveVariables)
        .reduce((prev, [name, moduleName]) => ({
          ...prev,
          [moduleName]: { name },
        }), resolve);
    }
  }

  // process pug in js
  if (this.resourcePath.split('.').pop().search(/^js/) !== -1 || source.match(/\s+pug`[\s\S]+`/)) {
    let useMacro = false;
    let jsxTemplate = source.replace(/(\n)?(\s*)?(.*)\s+pug`([\s\S]+?)`/g, (whole, _p0, _p1, p2, p3) => {
      const { jsx, useMacro: macroFound } = pugToJsx(p3, {
        template: true,
        resolve,
        transform,
        pragma,
        autoFix,
        rootDir,
        resourcePath,
      });
      if (macroFound) {
        useMacro = true;
      }
      const p0 = _p0 || '';
      const p1 = _p1 || '';
      const code = jsx.split(/\n/).map(e => ' '.repeat(p1.length + 2) + e).join('\n');
      return `${p0}${p1}${p2} (\n${code}\n${p1})`;
    });
    if (useMacro) {
      jsxTemplate = `import __macro from 'pug-as-jsx-loader/lib/macro';\n\n${jsxTemplate}`;
    }
    return options.detail ? { jsxTemplate, variables: [] } : jsxTemplate;
  }

  const result = pugToJsx(source, {
    template: true,
    resolve,
    transform,
    pragma,
    autoFix,
    rootDir,
    resourcePath,
  });
  const { jsxTemplate, usage, useThis, variables } = result;

  if (options.autoUpdateJsFile) {
    codemod({ useThis, variables }, this.resourcePath);
  }

  const basename = this.resourcePath.split(path.sep).pop().replace(/\.[a-zA-Z0-9]+$/, '');
  const code = jsxTemplate.replace(/%BASENAME%/g, `./${basename}`);

  if (options.transpiledFile) {
    const transpiledJsx = this.resourcePath.replace(/(\.[a-zA-Z0-9]+)$/, '$1.transpiled.jsx');
    const usageExample = ['/* USAGE EXAMPLE */',
      usage.replace(/%BASENAME%/g, basename),
      '/* // USAGE EXAMPLE */',
    ].join('\n').split('\n').map(e => `//  ${e}`).join('\n');
    fs.writeFileSync(transpiledJsx, `${code}\n\n${usageExample}\n`, 'utf8');
  }

  return options.detail ? { ...result, jsxTemplate: code } : code;
}
