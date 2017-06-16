import _ from 'underscore';
// import {
//   openingDispute,
//   events as orderEvents,
// } from '../../../utils/order';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.orderId) {
      throw new Error('Please provide the order id.');
    }

    this.orderId = options.orderId;
    this._state = {
      showDisputeOrderButton: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'actionBar gutterV';
  }

  events() {
    return {
      'click .js-openDispute': 'onClickOpenDispute',
    };
  }

  onClickOpenDispute() {
    this.trigger('clickOpenDispute');
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
    loadTemplate('modals/orderDetail/actionBar.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
