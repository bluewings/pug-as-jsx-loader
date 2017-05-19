import {
  TOGGLE_ASIDE,
} from './ui.actions';

const initialState = {
  showAside: false,
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case TOGGLE_ASIDE:
      return Object.assign({}, state, {
        showAside: !state.showAside,
      });
    default:
      return state;
  }
};
