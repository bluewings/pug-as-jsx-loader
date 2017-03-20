/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['preserve the order of childnodes #1',
`pre {state.start} ~ {state.end}`,
`<pre>
  {state.start} ~ {state.end}
</pre>`],

['preserve the order of childnodes #2',
`pre {state.start} {state.end}`,
`<pre>
  {state.start} {state.end}
</pre>`],

['preserve the order of childnodes #3',
`pre from {state.start}
  |  to {state.end}`,
`<pre>
  from {state.start} to {state.end}
</pre>`],

['sub components usage',
`Modal
  Modal.Header
    Modal.Title { header }
  Modal.Body { body }`,
`<Modal>
  <Modal.Header>
    <Modal.Title>{ header }</Modal.Title>
  </Modal.Header>
  <Modal.Body>{ body }</Modal.Body>
</Modal>`],
];
/* eslint-enable */

describe('bug-fixes', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
