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
  li(@repeat='props.items as item')
    a {item.message}\`;
}`,
`function Component(props) {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
function Component2(props) {
  return (
    <ul>
      {(props.items || []).map((item, i) =>
        <li key={i}>
          <a>{item.message}</a>
        </li>
      )}
    </ul>
  );
}`],
];
/* eslint-enable */

describe('simple', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.output.should.be.eql(expected);
    }));
  });
});
