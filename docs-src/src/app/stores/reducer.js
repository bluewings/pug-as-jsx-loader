import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import app from '../shared/stores/app.reducer';

const rootReducer = combineReducers({ routing: routerReducer, app });

export default rootReducer;
