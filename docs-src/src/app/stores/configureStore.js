import { createStore, compose } from 'redux';
import rootReducer from './reducer';

// eslint-disable-next-line no-underscore-dangle
const enhancer = ((typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose)();

export default function configureStore(initialState) {
  const store = createStore(rootReducer, initialState, enhancer);
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducer', () => {
      // eslint-disable-next-line global-require
      const nextRootReducer = require('./reducer');
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
