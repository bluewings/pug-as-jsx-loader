/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['test @for',
`ul
  li(@for='item in items') {item.name}
ul
  li(@for='(item, key) in items') {item.name}
ul
  li(@for='(item, key, index) in items') {item.name}`,
`<ul>
  { __macro_for(items).map((item, i) => (
    <li key={i}>{item.name}</li>
    ))}
</ul>
<ul>
  { __macro_for(items).map((item, key) => (
    <li key={key}>{item.name}</li>
    ))}
</ul>
<ul>
  { __macro_for(items).map((item, key, index) => (
    <li key={key}>{item.name}</li>
    ))}
</ul>`],

['test @for (complex)',
`div(@if='after.templates[0]')
  div(@for='(metric, key) in (allTemplates.filter(e => e.id === after.templates[0])[0] || {}).metrics')
    | {key} : {metric}`,
`{(after.templates[0]) && (
<div>
  { __macro_for((allTemplates.filter(e => e.id === after.templates[0])[0] || { }).metrics).map((metric, key) => (
      <div key={key}>
        {key} : {metric}
      </div>
      ))}
</div>
)}`],

['test @repeat',
`ul
  li(@repeat='items as item') {item}`,
`<ul>
  {(items || []).map((item, i) =>
    <li key={i}>{item}</li>
  )}
</ul>`],

['test @repeat (complex)',
`ul
  li(@repeat='allTemplates.filter(e => e.id === after.templates[0])[0].examples as example') {example}`,
`<ul>
  {(allTemplates.filter(e => e.id === after.templates[0])[0].examples || []).map((example, i) =>
    <li key={i}>{example}</li>
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
