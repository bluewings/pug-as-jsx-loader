/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['pragma: default (React)',
`div
   h4 hello world`,
`import React from 'react';

export default function() {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
`, {}],

['pragma: Preact',
`div
   h4 hello world`,
`import Preact from 'preact';

export default function() {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
`, { pragma: 'preact' }],

['pragma: Mithril',
`div
   h4 hello world`,
`import m from 'mithril';

export default function() {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
`, { pragma: 'mithril' }],
];
/* eslint-enable */

describe('issues', () => {
  tests.forEach(([name, input, expected, options]) => {
    it(name, () => run(input, options).then((output) => {
      output.output.should.be.eql(expected);
    }));
  });
});
