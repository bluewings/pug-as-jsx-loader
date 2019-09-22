# pug-as-jsx loader for webpack

[![npm version](https://badge.fury.io/js/pug-as-jsx-loader.svg)](https://badge.fury.io/js/pug-as-jsx-loader)

[![npm badge][npm-badge-png]][package-url]

## [Try it out here...](https://bluewings.github.io/pug-as-jsx-loader/)

<a href="https://bluewings.github.io/pug-as-jsx-loader/"><img src='https://bluewings.github.io/pug-as-jsx-loader/static/img/pug-as-jsx-loader.anim.gif'></a>

## Installation

```
npm install pug-as-jsx-loader --save-dev
```

## Usage

### webpack.config.js
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



### [pug | jade](https://pugjs.org) template (./file.pug)
```pug
div
  h1 {period.start} ~ {period.end}
  ul
    li(@repeat='items as item')
      i.ico(@if='item.icon', className='{"ico-" + item.icon}')
      ItemDetail(item='{item}')
```

### → transpiled function
```jsx
import React from 'react';

export default function (params = {}) {
  const { items, period, ItemDetail } = params;
  return (
    <div>
      <h1>
        {period.start} ~ {period.end}
      </h1>
      <ul>
        {items.map((item, i) =>
          <li key={i}>
            {(item.icon) && (
            <i className={`ico ico-${item.icon}`} />
            )}
            <ItemDetail item={item} />
          </li>
        )}
      </ul>
    </div>
  );
};
```

### import pug template
```jsx
import React from 'react';

import template from './file.pug';      // ← import pug template
import ItemDetail from './ItemDetail';

class Report extends React.Component {
  render() {
    const {
      items,
      period,
    } = this.props;

    return template.call(this, {        // ← use transpiled function
      // variables
      items,
      period,
      // components
      ItemDetail,
    });
  }
};
```

### integration with Typescript
```tsx
// react-app-env.d.ts
const React = require('react');

declare module '*.pug' {
  const template: (params?: { [key: string]: any }) => React.ReactElement;
  export = template;
}
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

[npm-badge-png]: https://nodei.co/npm/pug-as-jsx-loader.png
[package-url]: https://www.npmjs.com/package/pug-as-jsx-loader
