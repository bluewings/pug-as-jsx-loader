/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

describe('bug-fixes', () => {
  it('preserve the order of childnodes #1',
    () => run('pre {state.start} ~ {state.end}').then((output) => {
      output.jsx.should.be.eql(`<pre>
  {state.start} ~ {state.end}
</pre>`);
    }));

  it('preserve the order of childnodes #2',
    () => run('pre {state.start} {state.end}').then((output) => {
      output.jsx.should.be.eql(`<pre>
  {state.start} {state.end}
</pre>`);
    }));

  it('preserve the order of childnodes #3',
    () => run('pre from {state.start}\n  |  to {state.end}').then((output) => {
      output.jsx.should.be.eql(`<pre>
  from {state.start} to {state.end}
</pre>`);
    }));
});
