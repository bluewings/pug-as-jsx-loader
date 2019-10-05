require('should');
const { run, toTestArr } = require('./helper');

const tests = toTestArr(`
@NAME: interpolation

@INPUT:
div(foo=bar)
div(onClick=(() => click()))
div= foo
div #{bar}

@EXPECTED:
<>
  <div foo={bar}></div>
  <div onClick={() => click()}></div>
  <div>{foo}</div>
  <div>{bar}</div>
</>


@NAME: conditional

@INPUT:
div
  if foo
    div bar

  if foo
    div foo
  else
    div bar

  if foo
    div foo
  else if bar
    div bar
  else
    div baz

@EXPECTED:
<div>
  {foo && <div>bar</div>}
  {foo ? <div>foo</div> : <div>bar</div>}
  {foo ? <div>foo</div> : bar ? <div>bar</div> : <div>baz</div>}
</div>


@NAME: each

@INPUT:
div
  each value in array
    div= value

  each value, index in array
    div(key=index)= value

@EXPECTED:
<div>
  {__macro.for(array).map(value => (
    <div>{value}</div>
  ))}
  {__macro.for(array).map((value, index) => (
    <div key={index}>{value}</div>
  ))}
</div>


@NAME: case

@INPUT:
div
  case value
    when 'foo'
      div foo
    when 'bar': div bar
    default
      div baz

@EXPECTED:
<div>
  {(() => {
    switch (value) {
      case 'foo':
        return <div>foo</div>
      case 'bar':
        return <div>bar</div>
      default:
        return <div>baz</div>
    }
    return null
  })()}
</div>
`);

describe('pug syntax', () => {
  tests.forEach(({ name, input, expected }) => {
    it(name, () => run(input).then((output) => {
      output.jsx.should.be.eql(expected);
    }));
  });
});
