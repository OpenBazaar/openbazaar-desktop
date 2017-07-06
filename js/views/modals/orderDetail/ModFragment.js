import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this._state = {
      maxPeerIdLength: 8,
      showAvatar: false,
      ...options.initialState || {},
    };
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('modals/orderDetail/modFragment.html', t => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
