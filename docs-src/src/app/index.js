import React from 'react';
import App from './App';
import Home from './screens/Home';

const getRoute = (store, context) => ({
  path: '/',

  component({ children }) {
    return (
      <App context={context}>
        {children || <Home />}
      </App>
    );
  },

  childRoutes: [
    /* eslint-disable global-require */
    // require('./screens/Examples').default.getRoute(store),
    /* eslint-enable */
  ],
});

export default {
  options: {},
  getRoute,
};

