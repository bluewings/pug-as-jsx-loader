const pugAsJsxLoader = require('../index.js');

exports.run = function run(input, addOptions = {}) {
  return new Promise((resolve) => {
    const callback = (err, output) => {
      const jsx = ((output.match(/\n {2}return \(\n([\s\S]+)\n {2}\)/m) || [])[1] || '')
        .split(/\n/).filter(each => each).reduce((prev, curr) => {
          if (typeof prev.indent === 'undefined') {
            prev.indent = new RegExp(`^${curr.match(/^(\s+)/)[0]}`); // eslint-disable-line no-param-reassign
          }
          prev.lines.push(prev.indent ? curr.replace(prev.indent, '') : curr);
          return prev;
        }, { lines: [] }).lines.join('\n');

      const result = {
        jsx,
        output,
        variables: [],
        components: [],
      };

      const refs = output.replace(/\n\/\//gm, '\n')
        .replace(/\n/gm, ' ').replace(/\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .match(/template.call\(this, {([^}]+)}/);

      if (refs) {
        let cursor = null;
        refs[1].replace(/\/\/\s+/g, '//')
          .split(/[\s,]+/)
          .filter(each => each)
          .forEach((each) => {
            if (each === '//variables') {
              cursor = result.variables;
            } else if (each === '//components') {
              cursor = result.components;
            } else if (cursor && each) {
              cursor.push(each);
            }
          });
      }
      result.variables.sort();
      result.components.sort();
      resolve(result);
    };

    const opt = {
      callback,
      async: () => callback,
      cacheable: () => {},
      resourcePath: '.test.pug',
    };

    Object.keys(addOptions).forEach((key) => {
      opt[key] = addOptions[key];
    });

    pugAsJsxLoader.call(opt, input);
  });
};
