const pug = require('pug');
const eslint = require('eslint');
const jsxHelper = require('./jsx-helper');
const pugAsJsxLoader = require('./pug-as-jsx-loader');

module.exports = pugAsJsxLoader(jsxHelper(eslint), pug);
