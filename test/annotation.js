/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['test @repeat',
`ul
  li(@repeat='items as item') {item}`,
`<ul>
  {(items || []).map((item, i) =>
    <li key={i}>{item}</li>
  )}
</ul>`],

['test @repeat (preserve user-defined key)',
`ul
  li(@repeat='items as item', otherAttr='', key='{item.id}') {item}`,
`<ul>
  {(items || []).map((item, i) =>
    <li key={item.id} otherAttr="">{item}</li>
  )}
</ul>`],

['test @if, @unless, @show, @hide',
`div
  span(@if='props.if') hello
  span(@unless='props.unless') unless
  span(@show='props.show') show
  span(@hide='props.hide') hide`,
`<div>
  {(props.if) && (
  <span>hello</span>
  )}
  {!(props.unless) && (
  <span>unless</span>
  )}
  <span style={{ display: (props.show ? '' : 'none') }}>show</span>
  <span style={{ display: (props.hide ? 'none' : '') }}>hide</span>
</div>`],

['using inequality symbols with @if, @unless, @show, @hide',
`div
  span(@if='props.if < 1') hello
  span(@unless='props.unless > 2') unless
  span(@show='3 < show && show < 4') show
  span(@hide='4 <= hide && hide <= 5') hide`,
`<div>
  {(props.if < 1) && (
  <span>hello</span>
  )}
  {!(props.unless > 2) && (
  <span>unless</span>
  )}
  <span style={{ display: (3 < show && show < 4 ? '' : 'none') }}>show</span>
  <span style={{ display: (4 <= hide && hide <= 5 ? 'none' : '') }}>hide</span>
</div>`],
];

/* eslint-enable */

describe('annotaion', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
