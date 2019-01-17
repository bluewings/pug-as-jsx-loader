const pugAsJsxLoader = require('../');

exports.run = function run(input, addOptions = {}) {
  return new Promise((resolve) => {
    const opt = {
      cacheable: () => {},
      resourcePath: '.test.pug',
      detail: true,
    };

    Object.keys(addOptions).forEach((key) => {
      opt[key] = addOptions[key];
    });

    const { jsx, jsxTemplate: output, variables: params } = pugAsJsxLoader.call(opt, input);

    const { components, variables } = params.reduce((prev, e) => {
      if (e.search(/^[A-Z]/) === 0 && e.search(/[a-z]/) !== -1) {
        return { ...prev, components: [...prev.components, e] };
      }
      return { ...prev, variables: [...prev.variables, e] };
    }, { components: [], variables: [] });

    resolve({ jsx, output, variables, components });
  });
};
