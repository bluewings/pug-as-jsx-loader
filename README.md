<div align="center">
  <h1>pug-as-jsx-loader</h1>
</div>

<h2 align="center">Install</h2>

```bash
npm install pug-as-jsx-loader --save-dev
```

<h2 align="center">Usage</h2>

**file.js**
```js
```

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

```
TBD
```

### `transpiledFile`

```
TBD
```

### `autoUpdateJsFile`

```
TBD
```
