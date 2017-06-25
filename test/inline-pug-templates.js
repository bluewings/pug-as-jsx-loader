/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['sigle inline templates',
`function Component(props) {
  return pug\`
    div
      h4 hello world\`;
}`,
`function Component(props) {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}`],

['multiple inline templates',
`function Component(props) {
  return pug\`
    div
      h4 hello world\`;
}
function Component2(props) {
  return pug\`ul
  li(@for='item in props.items')
    a {item.message}\`;
}`,
`const __macro_for = items => ({ map: mapFn => Object.keys((items || [])).map((key, index) => mapFn(items[key], key, index)) });
function Component(props) {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
function Component2(props) {
  return (
    <ul>
      { __macro_for(props.items).map((item, i) => (
        <li key={i}>
          <a>{item.message}</a>
        </li>
        ))}
    </ul>
  );
}`],
];
/* eslint-enable */

describe('inline-pug-templates', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.output.should.be.eql(expected);
    }));
  });
});
