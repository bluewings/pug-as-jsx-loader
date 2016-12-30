/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

describe('bug-fixes', () => {
  it('preserve the order of childnodes',
    () => run('pre {state.start} ~ {state.end}').then((output) => {
      output.jsx.should.be.eql(`<pre>
  {state.start}
  ~
  {state.end}
</pre>`);
    }));
});
