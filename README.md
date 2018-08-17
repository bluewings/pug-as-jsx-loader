[![npm version](https://badge.fury.io/js/pug-as-jsx-loader.svg)](https://badge.fury.io/js/pug-as-jsx-loader)

[![npm badge][npm-badge-png]][package-url]

<div align="center">
  <img width="160" height="160"
    src="https://bluewings.github.io/pug-as-jsx-loader/static/img/pug-as-jsx.png">
  <a href="https://github.com/webpack/webpack" style="vertical-align:top">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>pug-as-jsx-loader</h1>
  Loads a <a href="https://github.com/pugjs/pug">pug</a> and transpiles it to <a href="https://reactjs.org/docs/introducing-jsx.html">jsx</a>.
  With pug-as-jsx-loader, you can use pugjs instead of jsx in the react app.
This process allows you to separate view and logic and make markups easy.
(Of course, you can also use the inline in js file without separating the pug into separate files.)

  <img width="640"  src="https://bluewings.github.io/pug-as-jsx-loader/static/img/anim-pug-as-jsx.gif">

And it also provides some recipes that will simplify the code as well.


</div>

<h2 align="center">Install</h2>

```bash
npm install pug-as-jsx-loader --save-dev
```

<h2 align="center">Usage</h2>

The ```pug-as-jsx-loader``` transpiles a pug file loaded with import or require into a jsx function. 

**App.js**
```js
import React from 'react';
import template from 'App.pug';

class App extends React.Component {
  render() {
    return template();
  }
}
```

Chain the ```pug-as-jsx-loader``` with the ```babel-loader``` to transform es6 syntax.

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: [ 'babel-loader', 'pug-as-jsx-loader' ]
      }
    ]
  }
}
```

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**[`resolveVariables`](#resolvevariables)**|`{Object}`|`null`| -|
|**[`resolveComponents`](#resolvecomponents)** |`{Object}`|`null`| -|
|**[`transpiledFile`](#transpiledfile)** |`{Boolean}`|`false`| -|
|**[`autoUpdateJsFile`](#autoiupdatejsfile)** |`{Boolean}`|`false`| -|

### `resolveVariables`

```
TBD
```

### `resolveComponents`

```js
{
  test: /\.pug$/,
  use: [
    'babel-loader',
    {
      loader: 'pug-as-jsx-loader',
      options: {
        resolveComponents: {
          // import Select from 'react-select';
          Select: 'react-select',
          // import { FormattedMessage as Intl } from 'react-intl';
          Intl: { module: 'react-intl', member: 'FormattedMessage' },
        },
      },
    },
  ],
},
```

### `transpiledFile`

```
TBD
```

### `autoUpdateJsFile`

```
TBD
```

<h2 align="center">License</h2>

[MIT](http://www.opensource.org/licenses/mit-license.php)

[npm-badge-png]: https://nodei.co/npm/pug-as-jsx-loader.png
[package-url]: https://www.npmjs.com/package/pug-as-jsx-loader
