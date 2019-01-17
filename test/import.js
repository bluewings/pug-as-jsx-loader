/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['@import css',
`// @import .scss => styles
.root(className='{styles.a}')
  h1.greeting hello world!`,
`<div className={'root ' + styles.a}>
  <h1 className="greeting">hello world!</h1>
</div>`],
];
/* eslint-enable */

describe('import', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
