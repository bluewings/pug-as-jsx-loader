const CLIEngine = require('eslint').CLIEngine;

const cli = new CLIEngine({
  useEslintrc: false,
  fix: true,
  rules: { 'prefer-template': 'error' },
});

const eslintFix = (source) => {
  const report = cli.executeOnText(source);
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
    jsx.split(/(<[^>]+>)/).filter((each) => each.trim()).forEach((_chunk) => {
      let chunk = _chunk.trim();
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
          type: chunk.replace(/^<([a-zA-Z0-9]+)/, '$1 ').split(/\s+/)[0],
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
        chunk = chunk.replace(/__block:([0-9.]+)__/g, (whole, p1) => {
          if (self.blocks[p1]) {
            self.parseJSX(`{${self.blocks[p1]}}`, cursor, stack);
            return '';
          }
          return p1;
        }).trim();
        if (chunk) {
          // cursor.push({
          //   type: self.TEXT_NODE,
          //   context: chunk,
          // });


          const elem = {
            type: self.TEXT_NODE,
            context: chunk,
          };
          cursor.push(elem);
          if (chunk.search(/\.map\s*\(.*?\)\s*=>/) !== -1) {
            cursor.mapFn = true;
            elem.indent = true;
          } else if (cursor.mapFn && chunk.search(/^\s*\)\s*}/) !== -1) {
            delete cursor.mapFn;
            elem.outdent = true;
          }
        }
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
      if (each.outdent) {
        indent = indent.substr(2);
      }
      if (each.type === self.TEXT_NODE) {
        if (each.context.trim()) {
          buffer.push(self.retrieveBlock(indent + each.context));
        }
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
    return self.printJSX(self.parseJSX(replaced), options);
  },
};

module.exports = {
  beautify: (jsx, options) => jsxHelper.beautify(jsx, options),
};
