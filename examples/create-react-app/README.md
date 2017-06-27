This is a create-react-app example.

Run the command below to view the results.

```
npm install
npm start
```

In order to apply the pug-as-jsx-loader, the following changes have been made after 'npm run eject'.
 
https://github.com/bluewings/pug-as-jsx-loader/commit/9ece6ebcab1de73a8a1cb3856a5b3559a7300d20 

```javascript
// webpack.config.js
const paths = require('./paths');

module.exports = {
  entry: '...',
  output: { /* ... */ },
  module: {
    rules: [
      {
        exclude: [
          /\.html$/,
          /\.pug$/,  // 1. exclude pug files from file-loader        ← add this line
          /\.(js|jsx)$/,
          /\.css$/,
          /\.json$/,
          /\.bmp$/,
          /\.gif$/,
          /\.jpe?g$/,
          /\.png$/,
        ],
        loader: require.resolve('file-loader'),
        options: {
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
      // 2. add pug loader                                           ← add this block below
      {
        test: /\.pug$/,
        include: paths.appSrc,
        use: [
          require.resolve('babel-loader'),
          require.resolve('pug-as-jsx-loader'),
        ],
      },
      // // 2. add pug loader
      {
        test: /\.(js|jsx)$/,
        include: paths.appSrc,
        loader: require.resolve('babel-loader'),
      },
    ],
  },
};
```
