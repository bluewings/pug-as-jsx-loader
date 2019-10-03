const pugAsJsxLoader = require('../');

function run(input, addOptions = {}) {
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
}

function toTestArr(b) {
  const { tests } = b.split(/\n/).reduce((prev, curr) => {
    let next = { ...prev };
    if (curr.search(/^@\s*NAME\s*:/) === 0) {
      const cursor = { name: curr.replace(/^@\s*NAME\s*:/g, '').trim(), input: [], expected: [] };
      next = { type: null, tests: [...next.tests, cursor], cursor };
    } else if (curr.search(/^@\s*INPUT\s*:/) === 0) {
      next = { ...next, type: 'input' };
    } else if (curr.search(/^@\s*EXPECTED\s*:/) === 0) {
      next = { ...next, type: 'expected' };
    } else if (next.type && Array.isArray(next.cursor[next.type])) {
      next.cursor[next.type] = [...next.cursor[next.type], curr];
    }
    return next;
  }, { type: null, tests: [], cursor: null });

  return tests.map(({ name, input, expected }) => ({
    name,
    input: input.join('\n').trim(),
    expected: expected.join('\n').trim(),
  }));
}

module.exports.run = run;
module.exports.toTestArr = toTestArr;
