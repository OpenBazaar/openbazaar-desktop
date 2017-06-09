import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide an OrderFulfillment model.');
    }

    if (!options.contractType) {
      throw new Error('Please provide the contract type.');
    }

    this.contractType = options.contractType;

    // this._state = {
    //   contractType: 'PHYSICAL_GOOD',
    //   ...options.initialState || {},
    // };
  }

  className() {
    return 'fulfillOrderTab';
  }

  // getState() {
  //   return this._state;
  // }

  // setState(state, replace = false, renderOnChange = true) {
  //   let newState;

  //   if (replace) {
  //     this._state = {};
  //   } else {
  //     newState = _.extend({}, this._state, state);
  //   }

  //   if (renderOnChange && !_.isEqual(this._state, newState)) {
  //     this._state = newState;
  //     this.render();
  //   }

  //   return this;
  // }

  render() {
    loadTemplate('modals/orderDetail/fulfillOrder.html', (t) => {
      this.$el.html(t({
        // ...this._state,
        contractType: this.contractType,
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
      }));
    });

    return this;
  }
}
