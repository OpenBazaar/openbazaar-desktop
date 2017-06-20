import _ from 'underscore';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (this.model) this.setModel(this.model);

    this._state = {
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
    loadTemplate('modals/orderDetail/summaryTab/orderDetailsModerator.html', t => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
