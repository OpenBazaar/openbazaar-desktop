import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        states: ['Point 1', 'Point 2'],
        currentState: 0,
        disputeState: 0,
        ...options.initialState,
      },
    });

    const state = this.getState();

    if (!Array.isArray(state.states)) {
      throw new Error('Please provide an array of states.');
    }

    if (state.states.length < 2) {
      throw new Error('Please provide at least two states.');
    }

    if (typeof state.currentState !== 'number') {
      throw new Error('Please provide the current state as a number.');
    }

    // pass in 0 for an empty progress bar, otherwise integers above
    // zero correspond to the 1 based position in the states array
    if (state.currentState < 0 ||
      state.currentState > state.states.length) {
      throw new Error('The current state cannot be less than zero or greater then ' +
       'the length of the provided states array.');
    }

    if (typeof state.disputeState !== 'number') {
      throw new Error('Please provide the dispute state as a number.');
    }

    // pass in 0 to not show the disputed indicator, otherwise pass in
    // the state the dispute was opened in and the indicator will appear
    // half-way between that state and the following one.
    if (state.disputeState < 0 ||
      state.disputeState > state.states.length - 1) {
      throw new Error('The dispute state must be greater than 0 and less than ' +
        'the length of the state array minus one.');
    }
  }

  className() {
    return 'stateProgressBar';
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/stateProgressBar.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
