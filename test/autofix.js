/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['autofix role=button',
`div(onClick='{handleClick}')
div(onClick='{handleClick}', role='link')
a(onClick='{handleClick}')
button(onClick='{handleClick}')`,
`<>
  <div onClick={handleClick} role='button'></div>
  <div onClick={handleClick} role="link"></div>
  <a onClick={handleClick}></a>
  <button onClick={handleClick}></button>
</>`],
];
/* eslint-enable */

describe('autofix', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input, { autoFix: true }).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
