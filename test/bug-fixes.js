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
    <Modal.Title>{header}</Modal.Title>
  </Modal.Header>
  <Modal.Body>{body}</Modal.Body>
</Modal>`],

['className conflict 1',
`a.nav-link
  i(className='{icons[name]}')`,
`<a className="nav-link">
  <i className={icons[name]}></i>
</a>`],

['className conflict 2',
`a.nav-link(href='#', onClick='{this.handleClick}')          
  i(style='{{ marginRight: 8 }}', className='{icons[name]}')`,
`<a className="nav-link" href="#" onClick={this.handleClick}>
  <i style={{ marginRight: 8 }} className={icons[name]}></i>
</a>`],

['className conflict 3',
`button.btn(className='{styles.btnAdAssets}' data-item-id='{item.id}')`,
`<button className={'btn ' + styles.btnAdAssets} data-item-id={item.id}></button>`],

['className conflict 4',
`button.btn.btn-default(type='button',
  className='{classNames(styles.btnApply, { "btn-active": refValue && refValue !== fieldValue })}',
  disabled='{!refValue || refValue === fieldValue}',
  onClick='{this.handleSyncClick}')`,
`<button
  className={'btn btn-default ' + classNames(styles.btnApply, { 'btn-active': refValue && refValue !== fieldValue })}
  type="button"
  disabled={!refValue || refValue === fieldValue}
  onClick={this.handleSyncClick}
></button>`],

['boolean shorthand',
`BrowserRouter
  Route(exact)
  Route(exact strict)
  Route(exact strict path="/")
  Route(path="/" exact strict)
  Route(exact path="/" component="{Home}")
  Route(path="/" exact component="{Home}")
  Route(path="/" component="{Home}" exact)
  Route(path="/" component="{Home}" exact="{true}")
  Route(path="/" component="{Home}" exact="{false}")`,
`<BrowserRouter>
  <Route exact={true}></Route>
  <Route exact={true} strict={true}></Route>
  <Route exact={true} strict={true} path="/"></Route>
  <Route path="/" exact={true} strict={true}></Route>
  <Route exact={true} path="/" component={Home}></Route>
  <Route path="/" exact={true} component={Home}></Route>
  <Route path="/" component={Home} exact={true}></Route>
  <Route path="/" component={Home} exact={true}></Route>
  <Route path="/" component={Home} exact={false}></Route>
</BrowserRouter>`],
];
/* eslint-enable */

describe('bug-fixes', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
