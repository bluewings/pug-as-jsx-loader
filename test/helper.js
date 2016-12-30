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
      resolve({ whole: output, jsx });
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
