/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['basic conversion',
`div
  h1.greeting hello world!`,
`<div>
  <h1 className="greeting">hello world!</h1>
</div>`],

['merge classNames',
`.btn(abbr="interrupt", class="btn-default")`,
`<div abbr="interrupt" className="btn btn-default" />`],

['use template-literal if possible',
`ul.nav.nav-tabs(className=\'{"nav-tabs-" + tabs.length}\')`,
'<ul className={`nav nav-tabs nav-tabs-${tabs.length}`} />'],

['line breaks when there are too many properties',
`button.navbar-toggle(type='button', data-toggle='collapse', data-target='#navbar', aria-expanded='false', aria-controls='navbar')`,
`<button
  aria-controls="navbar"
  aria-expanded="false"
  className="navbar-toggle"
  data-target="#navbar"
  data-toggle="collapse"
  type="button"
/>`],

['multi line options',
`div(options='{{ \
  lineNum: true, \
  theme: "monokai" }}')`,
`<div options={{ lineNum: true, theme: 'monokai' }} />`],

['use jsx expression',
`div
  WrappedComponent(id='wrap', __jsx='{...props}', data-attr='attr')`,
`<div>
  <WrappedComponent data-attr="attr" id="wrap" {...props} />
</div>`],

['use multiple jsx expressions',
`div
  WrappedComponent(id='wrap', __jsx='{...props}', __jsx='{...otherProps}')`,
`<div>
  <WrappedComponent id="wrap" {...props} {...otherProps} />
</div>`],
];
/* eslint-enable */

describe('simple', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
