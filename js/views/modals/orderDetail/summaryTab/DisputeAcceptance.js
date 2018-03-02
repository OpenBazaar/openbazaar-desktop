import _ from 'underscore';
import moment from 'moment';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      closerName: '',
      closerAvatarHashes: {},
      buyerViewing: false,
      vendorProcessingError: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'disputeAcceptanceEvent rowLg';
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
    loadTemplate('modals/orderDetail/summaryTab/disputeAcceptance.html', (t) => {
      this.$el.html(t({
        ...this._state,
        moment,
      }));
    });

    return this;
  }
}
