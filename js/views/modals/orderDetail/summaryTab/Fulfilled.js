import _ from 'underscore';
import moment from 'moment';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.dataObject) {
      throw new Error('Please provide a vendorOrderFulfillment data object.');
    }

    this._state = {
      contractType: 'PHYSICAL_GOOD',
      ...options.initialState || {},
    };

    this.dataObject = options.dataObject;
  }

  className() {
    return 'fulfilledEvent rowLg';
  }

  // events() {
  //   return {
  //     'click .js-fulfillOrder': 'onClickFulfillOrder',
  //   };
  // }

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
    loadTemplate('modals/orderDetail/summaryTab/fulfilled.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.dataObject || {},
        moment,
      }));
    });

    return this;
  }
}
