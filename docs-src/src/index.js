import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, match, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import FastClick from 'fastclick';
// import connectors from './app/shared/connectors';
import configureStore from './app/stores/configureStore';
import { getRoutes } from './app/config/routes';
import App from './app/App';
import Home from './app/screens/Home';

const store = configureStore();

const context = {
  // Enables critical path CSS rendering
  // https://github.com/kriasoft/isomorphic-style-loader
  insertCss: (...styles) => {
    // eslint-disable-next-line no-underscore-dangle
    const removeCss = styles.map(x => x._insertCss());
    return () => { removeCss.forEach(f => f()); };
  },
};

FastClick.attach(document.body);

// connectors.setup(store);

const routes = getRoutes(store, context);

const history = syncHistoryWithStore(browserHistory, store);

const setup = (renderProps) => {
  render(
    <Provider store={store}>
      <App context={context}>
        <Home />
      </App>
      {/*<Router {...renderProps} />*/}
    </Provider>,
    document.getElementById('app'),
  );

  // Enable Hot Module Replacement (HMR)
  /*if (module.hot) {
    module.hot.accept('./app/config/routes', () => {
      try {
        // eslint-disable-next-line global-require
        const newRoutes = require('./app/config/routes').getRoutes(store, context);
        render(
          <Provider store={store}>
            <Router history={history} routes={newRoutes} />
          </Provider>,
          document.getElementById('app'),
        );
      } catch (error) {
        document.title = `Hot Update Error: ${error.message}`;
        console.log(error);
      }
    });
  }*/
};

match({ history, routes }, (error, redirectLocation, renderProps) => {
  setup(renderProps);
});
