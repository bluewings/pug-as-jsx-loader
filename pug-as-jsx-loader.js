const os = require('os');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const querystring = require('querystring');

const isWin = (typeof os.platform === 'function' && os.platform().search(/win/i) !== -1);

module.exports = function (jsxHelper, { pug, loaderUtils }) {
  if (!pug) {
    pug = self.pug;
  }
  if (!fs.readFile || !fs.writeFile) {
    fs.readFile = (file, options, callback) => {
      if (typeof callback === 'function') {
        callback(null, '');
      }
    };
    fs.writeFile = (file, data, options, callback) => {
      if (typeof callback === 'function') {
        callback(null, '');
      }
    };
  }

  let jsxSyntaxIndex = 0;

  const cached = {
    components: {},
  };

  const LINE_DIVIDER = '__line_divider__';

  const { LESS_THAN, GREATER_THAN } = jsxHelper.constant;

  const annotations = [
    {
      // decorator
      pattern: /^(\s*)(.*)(@decorator='\s*([^\s]+)\s*')/,
      process: (current, pattern) => {
        const [, indent,,, decorator] = current.match(pattern);
        return {
          startBlock: `${indent}| {${decorator}(`,
          replacement: current.replace(pattern, '$1$2').replace(/\(\s*,\s*/, '('),
          endBlock: `${indent}| )}`,
        };
      },
    },
    {
      // for
      pattern: /^(\s*)(.*)(@for='\s*([(]{0,1})\s*([^\s]+)\s*(,\s+([a-zA-Z0-9_]+)){0,1}\s*(,\s+([a-zA-Z0-9_]+)){0,1}\s*([)]{0,1})\s+in\s+([^\n]+?)\s*')/,
      process: (current, pattern) => {
        const [, indent,,, parenthesesL, item,, key,, index, parenthesesR, items] = current.match(pattern);
        let paramKey;
        let paramIndex = '';
        if (!parenthesesL && !parenthesesR && !key) {
          paramKey = 'i';
        } else if (parenthesesL && parenthesesR && key) {
          paramKey = key;
          if (index) {
            paramIndex = `, ${index}`;
          }
        } else {
          return {
            startBlock: '',
            replacement: current,
            endBlock: '',
          };
        }
        return {
          macro: `const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
const __macro_for = items => ({
  map: (mapFn) => {
    let mapFns = [];
    if (items && items[IS_MAP_SENTINEL]) {
      items.mapEntries(([key, value], i) => {
        mapFns.push(mapFn(value, key, i));
      });
    } else if (items && items[IS_LIST_SENTINEL]) {
      items.forEach((value, i) => {
        mapFns.push(mapFn(value, i, i));
      });
    } else {
      mapFns = Object.keys((items || [])).map((key, index) => mapFn(items[key], key, index));
    }
    return mapFns;
  },
});
`,
          startBlock: `${indent}| { __macro_for(${items}).map((${item}, ${paramKey}${paramIndex}) => (`,
          replacement: current.replace(pattern, `$1$2key='{${paramKey}}'`),
          endBlock: `${indent}| ))}`,
        };
      },
    },
    {
      // repeat
      pattern: /^(\s*)(.*)(@repeat='\s*([^\n]+?)\s+as\s+([^\s]+)\s*(,\s+([a-zA-Z0-9_]+)){0,1}\s*')/,
      process: (current, pattern) => {
        const [, indent,,, items, item,, index = 'i'] = current.match(pattern);
        return {
          startBlock: `${indent}| {(${items} || []).map((${item}, ${index}) =>`,
          replacement: current.replace(pattern, `$1$2key='{${index}}'`),
          endBlock: `${indent}| )}`,
        };
      },
    },
    {
      // if
      pattern: /^(\s*)(.*)(@if='([^']+)')/,
      process: (current, pattern) => {
        const [, indent,,, condition] = current.match(pattern);
        return {
          startBlock: `${indent}| {(${condition
          .replace(/</g, LESS_THAN)
          .replace(/>/g, GREATER_THAN)}) && (`,
          replacement: current.replace(pattern, '$1$2').replace(/\(\s*,\s*/, '('),
          endBlock: `${indent}| )}`,
        };
      },
    },
    {
      // unless
      pattern: /^(\s*)(.*)(@unless='([^']+)')/,
      process: (current, pattern) => {
        const [, indent,,, condition] = current.match(pattern);
        return {
          startBlock: `${indent}| {!(${condition
          .replace(/</g, LESS_THAN)
          .replace(/>/g, GREATER_THAN)}) && (`,
          replacement: current.replace(pattern, '$1$2').replace(/\(\s*,\s*/, '('),
          endBlock: `${indent}| )}`,
        };
      },
    },
    {
      // show
      pattern: /^(\s*)(.*)(@show='([^']+)')/,
      process: (current, pattern) => ({
        replacement: current.replace(pattern, (whole, p1, p2, p3, p4) => `${p1 + p2}style="{{ display: (${p4.replace(/"/g, '\\"')} ? \\"\\" : \\"none\\") }}"`),
      }),
    },
    {
      // hide
      pattern: /^(\s*)(.*)(@hide='([^']+)')/,
      process: (current, pattern) => ({
        replacement: current.replace(pattern, (whole, p1, p2, p3, p4) => `${p1 + p2}style="{{ display: (${p4.replace(/"/g, '\\"')} ? \\"none\\" : \\"\\") }}"`),
      }),
    },
  ];

  const mergeClassNameProperty = jsx => jsx.replace(/\s+className=("([^"]+)"(.*)\s+className={(.*?)}((\s+[a-zA-Z0-9]+=)|(\s*>)))/g, (whole, p1, p2, p3, p4, p5) => {
    if (p3.search(/className=/) !== -1) {
      return ` className=${mergeClassNameProperty(p1)}`;
    }
    return ` className={"${p2} " + (${p4})}${p3} ${p5}`;
  });

  const extractScript = (jsx, blocks = []) => {
    const remainder = jsx.replace(/".*?"/g, '""').replace(/'.*?'/g, "''").replace(/\n/g, ' ').replace(/({[^{}]*})/gm, (whole, p1) => {
      blocks.push(p1.replace(/<[a-zA-Z].*>/g, (matched) => {
        const matches = matched.match(/\[\[[0-9]+]]/g);
        return matches ? matches.join(' ') : ' ';
      }));
      return `[[${blocks.length - 1}]]`;
    });
    if (remainder !== jsx) {
      return extractScript(remainder, blocks);
    }
    const fillBlockSpaces = (text) => {
      const replaced = text.replace(/(\[\[([0-9]+)]])/g, (whole, p1, p2) => blocks[parseInt(p2, 10)]);
      return replaced.match(/\[\[[0-9]+]]/g) ? fillBlockSpaces(replaced) : replaced;
    };
    return fillBlockSpaces((remainder.match(/\[\[[0-9]+]]/g) || []).join(' '))
      .replace(/\s+/g, ' ')
      .replace(/=>\s*([^{]+?[^})]+)/g, (whole, p1) => (p1.search(/[{}]/) !== -1) ? whole : `=> { ${p1} }`)
      .replace(/([a-zA-Z_$][a-zA-Z0-9_]*)(\s*)(=>\s*{)/g, '($1)$2$3')
      .trim();
  };

  const indentScript = (jsx) => {
    let indent = '';
    return jsx.replace(/\n/g, ' ').replace(/\s+/g, ' ')
    .replace(/".*?"/g, '""').replace(/'.*?'/g, "''")
    .replace(/^[^{]+/, '')
    .replace(/([{}])/g, (whole, p1) => {
      let replaced = '';
      if (p1 === '{') {
        indent += '  ';
        replaced = indent.substr(2) + p1;
      } else {
        replaced = indent.substr(2) + p1;
        indent = indent.split('').slice(2).join('');
      }
      return `\n${replaced}`;
    });
  };

  const extractVariables = (jsx) => {
    const PUSH = '+';
    const POP = '-';
    const variables = {};
    indentScript(extractScript(jsx))
      .split(/\n/)
      .map(each => each.replace(/\/\*(.*)?\*\//g, '')
        .replace(/\.\.\.([a-zA-Z_$])/g, '... $1'))
      .filter(each => each.trim() !== '')
      .reduce((stack, curr) => {
        const data = {
          local: [],
        };
        const replaced = `${curr.replace(/\?(.*?):/g, '?$1[[colon]]')
          .replace(/[a-zA-Z0-9_$]+\s*:/g, '"":')
          .replace(/\[\[colon]]/g, ':')} `;
        const type = replaced.trim().substr(0, 1) === '{' ? PUSH : POP;
        const used = replaced.replace(/(\([^)]+\)\s*=>|(const|let)\s+[a-zA-Z0-9_$]+)/g, (whole) => {
          if (whole.search(/^(const|let)\s+[a-zA-Z0-9_$]+$/) === -1) {
            data.local = (`${whole} `).replace(/<[a-zA-Z].*>/g, ' ').replace(/[^a-zA-Z0-9_.]/g, ' ')
              .replace(/\..*?\s+/g, ' ').trim()
              .split(/\s+/);
          } else {
            data.local = [whole.split(/\s+/)[1]];
          }
          return ' ';
        }).replace(/<[a-zA-Z].*>/g, ' ').replace(/[^a-zA-Z0-9_.]/g, ' ').replace(/\..*?\s+/g, ' ')
          .trim()
          .split(/\s+/);
        stack.reduce((prev, _curr) => prev.filter(each => _curr.local.indexOf(each) === -1), used)
        // stack.reduce((prev, _curr) => prev.filter(each => _curr.local.indexOf(each) === -1 && data.local.indexOf(each) === -1), used)
          .forEach((each) => {
            if (each && each.search(/^[0-9]/) === -1) {
              variables[each] = true;
            }
          });
        if (type === PUSH) {
          stack.push(data);
        } else {
          stack.pop();
        }
        return stack;
      }, []);
    return Object.keys(variables).sort();
  };

  const findComponents = root => new Promise((resolve, reject) => {
    if (!root) {
      resolve({});
    } else {
      const rootPath = root.search(/^\//) === -1 ? path.join(__dirname, root) : root;
      if (cached.components[rootPath]) {
        resolve(cached.components[rootPath]);
      } else {
        Promise.all([
          new Promise((_resolve, _reject) => {
            glob(`${rootPath}/**/*.js`, {}, (err, files) => err ? _reject(err) : _resolve(files)); // eslint-disable-line no-confusing-arrow
          }),
          new Promise((_resolve, _reject) => {
            glob(`${rootPath}/**/*.pug`, {}, (err, files) => err ? _reject(err) : _resolve(files)); // eslint-disable-line no-confusing-arrow
          }),
        ]).then(([jsFilesFound, pugFilesFound]) => {
          const jsFiles = jsFilesFound.reduce((prev, curr) => Object.assign({}, prev, {
            [curr.replace(/\.[a-zA-Z0-9]+$/, '')]: true,
          }), {});
          const pugFiles = pugFilesFound.reduce((prev, curr) => Object.assign({}, prev, {
            [curr.replace(/\.[a-zA-Z0-9]+$/, '')]: true,
          }), {});
          const found = Object.keys(pugFiles).reduce((prev, curr) => {
            if (!jsFiles[curr]) {
              return prev;
            }
            let chunks = curr.split('/');
            const name = chunks.pop();
            const next = Object.assign({}, prev, {
              [name]: prev[name] ? prev[name] : [],
            });
            chunks = chunks.join('/');
            if (chunks.search(/^\//) === -1) {
              chunks = path.join(__dirname, chunks);
            }
            next[name].push(chunks);
            return next;
          }, {});
          cached.components[rootPath] = found;
          resolve(found);
        }, (err) => {
          reject(err);
        });
      }
    }
  });

  const getRelativePath = (me, pathname, component) => {
    const chunks = me.split('/');
    let relativePath = chunks.reduce((prev) => {
      prev.unshift('..');
      return prev;
    }, pathname.split('/').reduce((prev, curr) => {
      const crumb = chunks.shift();
      if (curr !== crumb) {
        prev.push(curr);
        if (typeof crumb !== 'undefined') {
          prev.unshift('..');
        }
      }
      return prev;
    }, [])).join('/');
    if (relativePath.search(/^\./) === -1) {
      relativePath = `./${relativePath}`;
    }
  // path명의 마지막이 컴포넌트명이 다른 경우, 개별 파일로 직접 연결되는 케이스
    if (relativePath.split('/').pop() !== component) {
      relativePath = `${relativePath}/${component}`.replace(/[/]+/g, '/');
    }
    return relativePath;
  };

  const getUsageExample = (components, variables, files, rootPath) =>
  new Promise((resolve) => {
    const promise = rootPath ? findComponents(rootPath) : Promise.resolve({});

    promise.then((foundComponents) => {
      const example = [];
      example.push('/* USAGE EXAMPLE */');
      if (components.length > 0) {
        example.push('// Components');
        components.forEach((component) => {
          if (foundComponents[component]) {
            foundComponents[component].forEach((each, i) => {
              example.push(`${i > 0 ? '// ' : ''}import ${component} from '${getRelativePath(files.path, each, component)}'`);
            });
          } else {
            example.push(`import ${component} from '__modulePath__/${component}';`);
          }
        });
        example.push('');
      }
      example.push('// jsx');
      example.push(`import template from '${files.pug}';`);
      example.push('');
      example.push('class Report extends React.Component {');
      example.push('');
      example.push('  render() {');
      if (variables.length > 0) {
        example.push('    const {');
        example.push(`      ${variables.join(',\n//        ')},`);
        example.push('    } = this;');
      }
      example.push('');
      if (variables.length === 0 && components.length === 0) {
        example.push('    return template.call(this);');
      } else {
        example.push('    return template.call(this, {');
        if (variables.length > 0) {
          example.push('      // variables');
          example.push(`      ${variables.join(',\n//        ')}${components.length > 0 ? ',' : ''}`);
        }
        if (components.length > 0) {
          example.push('      // components');
          example.push(`      ${components.join(',\n//        ')},`);
        }
        example.push('    });');
      }
      example.push('  }');
      example.push('');
      example.push('}');
      example.push('/* // USAGE EXAMPLE */');
      resolve(`//  ${example.join('\n//  ')}`.replace(/\s+\n/g, '\n'));
    });
  });

  const updateJSX = (source, macros, files, rootPath, isJsFile, options = {}) => {
    if (isJsFile) {
      const output = [...Object.keys(macros), source].filter(e => e).join('\n');
      return new Promise((resolve, reject) => {
        if (options.transpiledFile) {
          fs.writeFile(files.jsx, output, 'utf8', err => (err ? reject(err) : resolve(output)));
        } else {
          resolve(output);
        }
      });
    }

    const reservedWords = ['__macro_for', 'function', 'Object', 'String', 'Number', 'Array', 'JSON', 'Math', 'null', 'this', 'return', 'true', 'false', 'new', 'event', 'React', 'typeof', LINE_DIVIDER, LESS_THAN, GREATER_THAN];
    let components = (source.match(/<([A-Z][a-zA-Z0-9_]+)/g) || []).reduce((distinct, curr) => {
      const tagName = curr.substr(1);
      if (tagName && distinct.indexOf(tagName) === -1) {
        distinct.push(tagName);
      }
      return distinct;
    }, []).sort();
    let importComponents = [];
    if (options.resolveComponents) {
      importComponents = components.map((name) => {
        if (options.resolveComponents[name]) {
          return { name, from: options.resolveComponents[name] };
        }
        return null;
      }).filter(e => e);
    }
    components = components.filter(name => !(options.resolveComponents && options.resolveComponents[name]));
    let variables = extractVariables(source)
      .filter(ref => ref && reservedWords.indexOf(ref) === -1)
      .sort();
    let importVariables = [];
    if (options.resolveVariables) {
      importVariables = variables.map((name) => {
        if (options.resolveVariables[name]) {
          return { name, from: options.resolveVariables[name] };
        }
        return null;
      }).filter(e => e);
    }
    variables = variables.filter(name => !(options.resolveVariables && options.resolveVariables[name]));
    components.forEach((e) => {
      const index = variables.indexOf(e);
      if (index !== -1) {
        variables.splice(index, 1);
      }
    });

    const refs = [...variables, ...components];

    return new Promise((resolve, reject) => {
      getUsageExample(components, variables, files, rootPath).then((example) => {
        const MAX_LINE_LENGTH = 100;
        let exportsFn;
        if (refs.length > 0) {
          exportsFn = `export default function (params = {}) {\n  const { ${refs.join(', ')} } = params;`;
          if (exportsFn.length > MAX_LINE_LENGTH) {
            exportsFn = `export default function (params = {}) {\n  const {\n    ${refs.join(',\n    ')},\n  } = params;`;
          }
        } else {
          exportsFn = 'export default function () {';
        }
      // eslint-disable-next-line prefer-template
        const jsxOutput = [
          "import React from 'react';",
          ...importComponents.map(({ name, from }) => `import ${name} from '${from}';\n`),
          ...importVariables.map(({ name, from }) => `import ${name} from '${from}';\n`),
          '\n',
          ...Object.keys(macros),
          exportsFn,
          '  return (',
        // source,
          jsxHelper.beautify(source, {
            indent: 4,
            maxLineLength: MAX_LINE_LENGTH,
            lineDivider: LINE_DIVIDER,
          }),
          '  );',
          '}\n',
          example,
        ].filter(line => line).join('\n').replace(/\n{2,}/g, '\n\n') + '\n';
        if (options.transpiledFile) {
          fs.writeFile(files.jsx, jsxOutput, 'utf8', err => (err ? reject(err) : resolve(jsxOutput)));
        } else {
          resolve(jsxOutput);
        }
      });
    });
  };

  const updateCssClass = (source, files) => {
    // classNames found
    const cssClasses = (source.match(/\s+styleName="[^"]+"/g) || []).reduce((dict, curr) => {
      curr.replace(/(^\s+styleName="|"$)/g, '').split(/\s+/).forEach((chunk) => {
        if (dict.indexOf(chunk) === -1) {
          dict.push(chunk);
        }
      });
      return dict;
    }, []);
    // not defined classes
    const notDefined = cssClasses.concat();

    const promise = new Promise((resolve) => {
      fs.readFile(files.scss, 'utf8', (err, data) => {
        if (err || typeof data !== 'string') {
          resolve('');
          return;
        }
      // remove comment, remove string names
        const refined = data.replace(/\/\*[\s\S]+?\*\//g, '')
        .replace(/\/\/.*/gm, '')
        .replace(/".*"/g, '"..."')
        .replace(/'.*'/g, "'...'")
        .match(/\.[a-zA-Z_][a-zA-Z0-9_-]*/g) || [];

        refined.reduce((dict, curr) => {
          const replaced = curr.replace(/^\./, '');
          if (dict.indexOf(replaced) === -1) {
            dict.push(replaced);
            const index = notDefined.indexOf(replaced);
            if (index !== -1) {
              notDefined.splice(index, 1);
            }
          }
          return dict;
        }, []);

        resolve(data);
      });
    });

    return new Promise((resolve, reject) => {
      promise.then((data) => {
        const cssStyles = notDefined.reduce((content, className) => {
          const time = new Date().toISOString().replace(/\.[0-9]+Z/, 'Z');
          content.push(`
/* [${time}] added by pug-to-jsx loader */`);
          content.push(`.${className} {`);
          content.push('    background-color: yellow !important;');
          content.push('}');
          return content;
        }, []).join('\n');
        if (cssStyles) {
          fs.writeFile(files.scss, `${data}\n${cssStyles}`, 'utf8', err => (err ? reject(err) : resolve()));
        } else {
          resolve();
        }
      });
    });
  };

  const renderPug = (source) => {
    // prepare for case sensitive
    let replaced = source
      .replace(/__jsx=/g, () => {
        jsxSyntaxIndex += 1;
        return `jsx-syntax-${jsxSyntaxIndex}--=`;
      })
      .replace(/([A-Z])/g, (whole, p1) => `upper___${p1}`)
      .replace(/(upper___[A-Za-z0-9]+)\.(upper___)/g, (whole, p1, p2) => `${p1}___dot_btw_cpnts___${p2}`);

    // remove comment
    replaced = replaced.split(/\n/).reduce((dict, curr) => {
      let indentSize = curr.search(/[^\s]/);
      if (dict.indentSize !== -1 && indentSize <= dict.indentSize && curr.trim()) {
        dict.indentSize = -1; // eslint-disable-line no-param-reassign
      }
      if (dict.indentSize === -1) {
        indentSize = curr.search(/\/\/-.*/g, '');
        if (indentSize !== -1) {
          dict.indentSize = indentSize; // eslint-disable-line no-param-reassign
        }
      }
      if (dict.indentSize === -1) {
        dict.lines.push(curr);
      }
      return dict;
    }, {
      indentSize: -1,
      lines: [],
    }).lines.join('\n');

    const macros = {};

    // process annotations
    const transformed = replaced.split(/\n/).reduce((dict, curr) => {
      // attach remaind end block codes.
      const indentSize = curr.search(/[^\s]/);
      if (indentSize !== -1) {
        const endBlocks = [];
        dict.endBlocks.forEach((each) => {
          (indentSize <= each.search(/[^\s]/) ? dict.lines : endBlocks).push(each);
        });
        dict.endBlocks = endBlocks; // eslint-disable-line no-param-reassign
      }
      // parse annotations
      annotations.forEach((annotation) => {
        if (curr.match(annotation.pattern)) {
          const { macro, replacement, startBlock, endBlock } = annotation.process(curr, annotation.pattern);
          if (macro) {
            macros[macro] = true;
          }
          if (startBlock) {
            if (startBlock.search(/[^\s]/) !== -1) {
              dict.lines.push(`${Array(startBlock.search(/[^\s]/) + 1).join(' ')}// ${LINE_DIVIDER}`);
            }
            dict.lines.push(startBlock);
          }
          if (endBlock) {
            dict.endBlocks.unshift(endBlock);
          }
          curr = replacement; // eslint-disable-line no-param-reassign
        }
      });
      dict.lines.push(curr);
      return dict;
    }, {
      endBlocks: [],
      lines: [],
    });

    transformed.endBlocks.forEach((item) => {
      transformed.lines.push(item);
    });
    replaced = transformed.lines.join('\n')
      .replace(/key='\{.*?\}',([^)]*key='\{.*?\}')/, '$1');

    // render to html and restore case sensitive
    replaced = pug.render(replaced, { pretty: true }).replace(/upper___([a-zA-Z])/g, (whole, p1) => p1.toUpperCase()).replace(/\{([^{}]+)\}/g, (whole, p1) => `{${p1.replace(/&quot;/g, '"')}}`);

    // fixes
    replaced = replaced
      .replace(/ class="/g, ' className="')
      .replace(/ for="/g, ' htmlFor="')
      .replace(/="(\{.*?\})[;]{0,1}"/g, (whole, p1) => `=${p1
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')}`)
      .replace(/<!--(.*?)-->/g, (whole, p1) => `{ /* ${p1.replace(/\/\*/g, ' ').replace(/\*\//g, ' ').trim()} */ }`)
      .replace(/\n/g, '\n    ')
      .replace(/___dot_btw_cpnts___/g, '.')
      .trim();

    // merge classnames
    replaced = `    ${mergeClassNameProperty(replaced)}`;
    // self-closing-component
    replaced = replaced.replace(/<([a-zA-Z0-9]+)(\s+[^>]+){0,1}>\s*<\/([a-zA-Z0-9]+)>/g, (whole, p1, p2, p3) => {
      if (p1 === p3) {
        return `<${p1}${p2 || ''} />`;
      }
      return whole;
    }).replace(/\{\}/g, '{ }');
    return { replaced, macros };
  };

  return function (source) {
    this.cacheable();

    let options = {};
    if (loaderUtils && typeof loaderUtils.getOptions === 'function') {
      options = loaderUtils.getOptions(this) || {};
    }

    const callback = this.async();

    // related file names
    const files = {
      path: this.resourcePath.replace(/\/[^/]+$/, ''),
      js: this.resourcePath.replace(/\.[a-zA-Z0-9]+$/, '.js'),
      jsx: this.resourcePath.replace(/(\.[a-zA-Z0-9]+)$/, '$1.transpiled.jsx'),
      scss: this.resourcePath.replace(/\.[a-zA-Z0-9]+$/, '.scss'),
      pug: `./${this.resourcePath.replace(/\.[a-zA-Z0-9]+$/, '').split('/').pop()}.pug`,
    };

    if (!isWin) {
      const fileTypes = ['path', 'js', 'jsx', 'scss'];
      fileTypes.forEach((type) => {
        if (files[type].search(/^\//) === -1) {
          files[type] = path.join(__dirname, files[type]);
        }
      });
    }
    let { root } = typeof this.query === 'object' ? (this.query || {}) : querystring.parse((this.query || '').replace(/^\?/, ''));
    if (root) {
      root = root.replace(/__\//g, '../');
    }
    // root = '../../src/app'

    let isJsFile = false;
    if (this.resourcePath.split('.').pop().search(/^js/) !== -1 || source.match(/\s+pug`[\s\S]+`/)) {
      isJsFile = true;
    }
    let replaced;
    let macros = {};
    if (isJsFile) {
      replaced = source.replace(/\n(\s*)?(.*)\s+pug`([\s\S]+?)`/g, (whole, p1, p2, p3) => {
        const result = renderPug(p3.trim());
        macros = Object.assign({}, macros, result.macros);
        const rendered = jsxHelper.beautify(result.replaced, {
          indent: p1.length + 2,
          maxLineLength: 100,
          lineDivider: LINE_DIVIDER,
        });
        return `\n${p1}${p2} (\n${rendered}\n${p1})`;
      });
    } else {
      const rendered = renderPug(source);
      replaced = rendered.replaced;
      macros = rendered.macros;
    }
    if (source === replaced) {
      return callback(null, source);
    }

    Promise.all([
      updateJSX(replaced, macros, files, root, isJsFile, options),
      isJsFile ? Promise.resolve() : updateCssClass(replaced, files),
    ])
    .then(
      (result) => {
        callback(null, result[0]);
      })
    .catch(
      (reason) => {
        callback(reason);
      });
  };
};
