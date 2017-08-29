/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

describe('variables and components', () => {
  it('simple extract',
  () => run("li(@repeat='items as item')\n  ItemDetail(item='{item}')").then((output) => {
    output.variables.length.should.be.eql(1);
    output.variables.should.containEql('items');
    output.components.length.should.be.eql(1);
    output.components.should.containEql('ItemDetail');
  }));

  it('ignore reserved keyword: React, this',
    () => run('div\n  | {React.Children.only(this.props.children)}').then((output) => {
      output.variables.length.should.be.eql(0);
    }));

  it('fat arrow function /w concise syntax #1',
    () => run("input(type='text', ref='{(input) => this.textInput = input}')").then((output) => {
      output.variables.length.should.be.eql(0);
    }));

  it('fat arrow function /w concise syntax #2',
    () => run("input(type='text', ref='{input => this.textInput = input}')").then((output) => {
      output.variables.length.should.be.eql(0);
    }));

  it('ignore object key',
    () => run('CodeMirror(options=\'{{ mode: "yaml", styleActiveLine: true, lineNumbers: lineNum, lineWrapping: true, theme: "monokai" }}\')').then((output) => {
      output.variables.length.should.be.eql(1);
      output.variables.should.containEql('lineNum');
    }));

  it('ignore object key',
    () => run(`div
    ChildComponent(@if='ChildComponent')
    div(@if='!ChildComponent')
      h1 has no child`)
    .then((output) => {
      output.variables.length.should.be.eql(0);
      output.components.length.should.be.eql(1);
    }));
});
