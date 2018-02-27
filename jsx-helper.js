module.exports = (eslint = {}) => {
  const CLIEngine = (eslint && eslint.CLIEngine) || null;

  const cli = CLIEngine ? new CLIEngine({
    useEslintrc: false,
    fix: true,
    rules: { 'prefer-template': 'error' },
  }) : {};

  const constant = {
    LESS_THAN: '__less_than__',
    GREATER_THAN: '__greater_than__',
  };

  const eslintFix = (source) => {
    const report = typeof cli.executeOnText === 'function' ? cli.executeOnText(source) : source;
    if (report && report.results && report.results[0] && report.results[0].output) {
      return report.results[0].output
        .replace(/\s+/g, ' ')
        .replace(/{\s+([a-zA-z0-9_])/g, '{$1')
        .replace(/([a-zA-z0-9_])\s+}/g, '$1}')
        .replace(/`(.*?)`/g, '__tick_start__$1__tick_end__')
        .replace(/__tick_end__\s*\+\s*__tick_start__/g, '')
        .replace(/__tick_(start|end)__/g, '`')
        .trim();
    }
    return source;
  };

  const jsxHelper = {
    TEXT_NODE: 'TEXT_NODE',
    blocks: {},
    quotes: {},
    preserveQuote(source) {
      const self = this;
      return source.replace(/"(.*?)"/g, (whole, p1) => {
        const randomId = Math.random();
        self.quotes[randomId] = p1;
        return `__quote:${randomId}__`;
      });
    },
    preserveBlock(source) {
      const self = this;
      let replaced = source.replace(/{([^{}]+)}/g, (whole, p1) => {
        const randomId = Math.random();
        self.blocks[randomId] = p1;
        return `__block:${randomId}__`;
      });
      if (replaced.match(/{([^}]+)}/g)) {
        replaced = self.preserveBlock(replaced);
      }
      return replaced;
    },
    parseJSX(jsx, children = [], stack = []) {
      const self = this;
      let cursor = children;
      jsx.split(/(<[^>]+>)/).filter(each => each.trim()).forEach((_chunk) => {
        const chunk = _chunk.trim();
        const is = { textNode: true };
        if (chunk.search(/^<[^/]/) !== -1) {
          is.open = true;
          delete is.textNode;
        }
        if (chunk.search(/^<\//) !== -1 || chunk.search(/^<.+\/>$/) !== -1) {
          is.close = true;
          delete is.textNode;
        }
        if (is.open) {
          const elem = {
            type: chunk.replace(/^<([a-zA-Z0-9.]+)/, '$1 ').split(/\s+/)[0],
            props: ((chunk.replace(/(\/){0,1}>/, ' ').match(/([a-zA-Z0-9-]+)=([^\s]+)/g)) || []).reduce((props, curr) => {
              const [, name, value] = curr.match(/([a-zA-Z0-9-]+)=([^\s]+)/);
              return Object.assign({}, props, {
                [name]: value,
              });
            }, {}),
            children: [],
          };
          cursor.push(elem);
          cursor = elem.children;
          stack.push(elem);
        }
        if (is.textNode) {
          chunk.split(/(__block:[0-9.]+__)/).forEach((each) => {
            if (!each) {
              return;
            }
            const found = each.match(/__block:([0-9.]+)__/);
            if (found && self.blocks[found[1]]) {
              self.parseJSX(`{${self.blocks[found[1]]}}`, cursor, stack);
              return;
            }
            const elem = {
              type: self.TEXT_NODE,
              context: each,
            };
            cursor.push(elem);
            if (chunk.search(/\.map\s*\(.*?\)\s*=>/) !== -1) {
              cursor.mapFn = true;
              elem.indent = true;
            } else if (cursor.mapFn && chunk.search(/^\s*\)\s*}/) !== -1) {
              delete cursor.mapFn;
              elem.outdent = true;
            }
          });
        }
        if (is.close) {
          stack.pop();
          if (stack.length > 0) {
            cursor = stack[stack.length - 1].children;
          } else {
            cursor = children;
          }
        }
      });
      return children;
    },
    retrieveBlock(source) {
      const self = this;
      return source.replace(/__quote:([0-9.]+)__/g, (whole, p1) => `'${self.quotes[p1]}'`)
      .replace(/__block:([0-9.]+)__/g, (whole, p1) => {
        self.blocks[p1] = self.blocks[p1].replace(/__quote:([0-9.]+)__/g, (_whole, q1) => `'${self.quotes[q1]}'`);
        if (self.blocks[p1].match(/__block:([0-9.]+)__/)) {
          self.blocks[p1] = self.retrieveBlock(self.blocks[p1]);
        }
        return `{${eslintFix(self.blocks[p1])}}`;
      });
    },
    printElem(elem, indent, options, closeTag) {
      const self = this;
      const replaced = elem.type + Object.keys(elem.props).sort().reduce((prev, curr) => {
        let value = elem.props[curr];
        value = value.replace(/__quote:([0-9.]+)__/g, (whole, p1) => `"${self.quotes[p1]}"`);
        value = self.retrieveBlock(value);
        prev.push(`${curr}=${value}`);
        return prev;
      }, ['']).join('__attributes__');
      let result = `${indent}<${replaced.replace(/__attributes__/g, ' ')}${closeTag ? ' />' : '>'}`;
      if (options.maxLineLength && options.maxLineLength < result.length) {
        result = `${indent}<${replaced.replace(/__attributes__/g, `\n${indent}  `)}\n${indent}${closeTag ? '/>' : '>'}`;
      }
      return result;
    },
    printJSX(children, options = {}, buffer = [], _indent = '') {
      const self = this;
      let indent = _indent;
      children.forEach((each) => {
        if (each.context === ');}') {
          each.outdent = true;
        }
        if (each.outdent) {
          indent = indent.substr(2);
        }
        if (each.type === self.TEXT_NODE) {
          buffer.push(self.retrieveBlock(`${indent}__textnode_start__${each.context}__textnode_end__`));
        } else if (each.children && each.children.length > 0) {
          if (each.children.length === 1 && each.children[0].type === self.TEXT_NODE) {
            const replaced = `${self.printElem(each, indent, options)}${each.children[0].context}</${each.type}>`;
            if (options.maxLineLength && options.maxLineLength < replaced.length) {
              buffer.push(`${self.printElem(each, indent, options)}\n${indent}  ${each.children[0].context}\n${indent}</${each.type}>`);
            } else {
              buffer.push(replaced);
            }
          } else {
            buffer.push(`${self.printElem(each, indent, options)}`);
            self.printJSX(each.children, options, buffer, `${indent}  `);
            buffer.push(`${indent}</${each.type}>`);
          }
        } else {
          buffer.push(`${self.printElem(each, indent, options, true)}`);
        }
        if (each.indent) {
          indent += '  ';
        }
      });
      const padding = Array((options.indent || 0) + 1).join(' ');
      return padding + buffer.join('\n').replace(/\n/g, `\n${padding}`);
    },
    beautify(jsx, options) {
      let replaced = jsx.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const self = this;
      self.quotes = {};
      self.blocks = {};
      replaced = self.preserveQuote(replaced);
      replaced = self.preserveBlock(replaced);
      replaced = self.printJSX(self.parseJSX(replaced), options);
      replaced = replaced.replace(/__textnode_end__\n\s*__textnode_start__/g, '')
        .replace(/\n(\s*)__textnode_start__/gm, '\n$1')
        .replace(/__textnode_start__(\s*)\n/gm, '$1\n')
        .replace(/__textnode_(start|end)__/g, '');
      if (options && options.lineDivider) {
        replaced = replaced.replace(new RegExp(`(\\s+)(.*?){\\s*\\/\\*\\s*${options.lineDivider}\\s*\\*\\/\\s*}(.*)`, 'g'), '\n$1$2\n$1$3');
      }
      // convert protected inequality symbols
      replaced = replaced
        .replace(new RegExp(constant.LESS_THAN, 'g'), '<')
        .replace(new RegExp(constant.GREATER_THAN, 'g'), '>')
        .replace(/jsx-syntax-[0-9]+--=/g, '');
      return replaced.replace(/\s+$/gm, '');
    },
  };

  return {
    constant,
    beautify: (jsx, options) => jsxHelper.beautify(jsx, options),
  };
};
