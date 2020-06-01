import {createStore, combineReducers, applyMiddleware, compose} from 'redux';
import {enhanceReduxMiddleware} from 'kepler.gl/middleware';
import thunk from 'redux-thunk';
import {routerReducer, routerMiddleware} from 'react-router-redux';
import {browserHistory} from 'react-router';
import appReducer from './app-reducer';

const reducers = combineReducers({
  app: appReducer,
  routing: routerReducer
});

const middlewares = enhanceReduxMiddleware([thunk, routerMiddleware(browserHistory)]);
const enhancers = [applyMiddleware(...middlewares)];

const initialState = {};

// add redux devtools
const composeEnhancers = compose;

export default createStore(reducers, initialState, composeEnhancers(...enhancers));
