/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

describe('annotaion', () => {
  it('test @repeat',
    () => run("ul\n  li(@repeat='items as item') {item}").then((output) => {
      output.jsx.should.be.eql(`<ul>
  {items.map((item, i) =>
    <li key={i}>{item}</li>
  )}
</ul>`);
    }));

  it('test @repeat (preserve user-defined key)',
    () => run("ul\n  li(@repeat='items as item', otherAttr='', key='{item.id}') {item}").then((output) => {
      output.jsx.should.be.eql(`<ul>
  {items.map((item, i) =>
    <li key={item.id} otherAttr="">{item}</li>
  )}
</ul>`);
    }));

  it('test @if, @unless, @show, @hide',
    () => run(`div
  span(@if='props.if') hello
  span(@unless='props.unless') unless
  span(@show='props.show') show
  span(@hide='props.hide') hide`)
    .then((output) => {
      output.jsx.should.be.eql(`<div>
  {(props.if) && (
  <span>hello</span>
  )}
  {!(props.unless) && (
  <span>unless</span>
  )}
  <span style={{ display: (props.show ? '' : 'none') }}>show</span>
  <span style={{ display: (props.hide ? 'none' : '') }}>hide</span>
</div>`);
    }));
});
