import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      states: ['Point 1', 'Point 2'],
      currentState: 0,
      disputeState: 0,
      ...options.initialState || {},
    };

    if (!Array.isArray(this._state.states)) {
      throw new Error('Please provide an array of states.');
    }

    if (this._state.states.length < 2) {
      throw new Error('Please provide at least two states.');
    }

    if (typeof this._state.currentState !== 'number') {
      throw new Error('Please provide the current state as a number.');
    }

    // pass in 0 for an empty progress bar, otherwise integers above
    // zero correspond to the 1 based position in the states array
    if (this._state.currentState < 0 ||
      this._state.currentState > this._state.states.length) {
      throw new Error('The current state cannot be less than zero or greater then ' +
       'the length of the provided states array.');
    }

    if (typeof this._state.disputeState !== 'number') {
      throw new Error('Please provide the dispute state as a number.');
    }

    // pass in 0 to not show the disputed indicator, otherwise pass in
    // the state the dispute was opened in and the indicator will appear
    // half-way between that state and the following one.
    if (this._state.disputeState < 0 ||
      this._state.disputeState > this._state.states.length - 1) {
      throw new Error('The dispute state must be greater than 0 and less than ' +
        'the length of the state array minus one.');
    }
  }

  className() {
    return 'stateProgressBar';
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('modals/orderDetail/stateProgressBar.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
