/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

describe('simple', () => {
  it('basic conversion',
    () => run('div\n  h1.greeting hello world!').then((output) => {
      output.jsx.should.be.eql(`<div>
  <h1 className="greeting">hello world!</h1>
</div>`);
    }));

  it('merge classNames',
    () => run('.btn(abbr="interrupt", class="btn-default")').then((output) => {
      output.jsx.should.be.eql('<div abbr="interrupt" className="btn btn-default" />');
    }));

  it('use template-literal if possible',
    () => run('ul.nav.nav-tabs(className=\'{"nav-tabs-" + tabs.length}\')').then((output) => {
      output.jsx.should.be.eql('<ul className={`nav nav-tabs nav-tabs-${tabs.length}`} />'); // eslint-disable-line no-template-curly-in-string
    }));

  it('line breaks when there are too many properties',
    () => run("button.navbar-toggle(type='button', data-toggle='collapse', data-target='#navbar', aria-expanded='false', aria-controls='navbar')").then((output) => {
      output.jsx.should.be.eql(`<button
  aria-controls="navbar"
  aria-expanded="false"
  className="navbar-toggle"
  data-target="#navbar"
  data-toggle="collapse"
  type="button"
/>`);
    }));
});
