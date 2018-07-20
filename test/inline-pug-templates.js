/* global describe it */
/* eslint no-undef: "error" */
require('should');
const run = require('./helper').run;

/* eslint-disable */
const tests = [
['sigle inline templates',
`function Component(props) {
  return pug\`
    div
      h4 hello world\`;
}`,
`function Component(props) {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}`],

['multiple inline templates',
`function Component(props) {
  return pug\`
    div
      h4 hello world\`;
}
function Component2(props) {
  return pug\`ul
  li(@for='item in props.items')
    a {item.message}\`;
}`,
`const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
const __macro_for = items => ({
  map: (mapFn) => {
    let mapFns = [];
    if (items && items[IS_MAP_SENTINEL]) {
      items.mapEntries(([key, value], i) => {
        mapFns.push(mapFn(value, key, i));
      });
    } else if (items && items[IS_LIST_SENTINEL]) {
      items.forEach((value, i) => {
        mapFns.push(mapFn(value, i, i));
      });
    } else {
      mapFns = Object.keys((items || [])).map((key, index) => mapFn(items[key], key, index));
    }
    return mapFns;
  },
});

function Component(props) {
  return (
    <div>
      <h4>hello world</h4>
    </div>
  );
}
function Component2(props) {
  return (
    <ul>
      { __macro_for(props.items).map((item, i) => (
        <li key={i}>
          <a>{item.message}</a>
        </li>
        ))}
    </ul>
  );
}`],

['issue-19',
`const CodePen = ({dataSlug}) => pug\`
  div.mb-4
    p.codepen(
      data-height='{400}',
      data-theme-id='dark',
      data-slug-hash='{dataSlug}',
      data-default-tab='result',
      data-user='PhmNgocNghia',
      data-embed-version='{2}',
      data-preview='{true}'
    )\`;

export default CodePen;`,
`const CodePen = ({dataSlug}) => (
  <div className="mb-4">
    <p
      className="codepen"
      data-default-tab="result"
      data-embed-version={2}
      data-height={400}
      data-preview={true}
      data-slug-hash={dataSlug}
      data-theme-id="dark"
      data-user="PhmNgocNghia"
    />
  </div>
);

export default CodePen;`],
];
/* eslint-enable */

describe('inline-pug-templates', () => {
  tests.forEach(([name, input, expected]) => {
    it(name, () => run(input).then((output) => {
      output.output.should.be.eql(expected);
    }));
  });
});
