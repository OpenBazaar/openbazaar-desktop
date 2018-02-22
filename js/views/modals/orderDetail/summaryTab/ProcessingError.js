// import $ from 'jquery';
// import {
//   cancelingOrder,
//   cancelOrder,
//   events as orderEvents,
// } from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.orderId) {
      throw new Error('Please provide the order id.');
    }

    const opts = {
      initialState: {
        isBuyer: false,
        isModerated: false,
        isOrderCancelable: false,
        isDisputable: false,
        errors: [],
        ...options.initialState || {},
      },
    };

    super(opts);

    this.orderId = options.orderId;
  }

  className() {
    return 'rowLg clrTErr';
  }

  // events() {
  //   return {
  //     'click .js-cancelOrder': 'onClickCancelOrder',
  //   };
  // }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/processingError.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
