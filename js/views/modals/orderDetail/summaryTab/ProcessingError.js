// import $ from 'jquery';
import {
  cancelingOrder,
  cancelOrder,
  events as orderEvents,
} from '../../../../utils/order';
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
        cancelInProgress: cancelingOrder(options.orderId),
        errors: [],
        ...options.initialState || {},
      },
    };

    super(opts);

    this.orderId = options.orderId;

    this.listenTo(orderEvents, 'cancelingOrder', e => {
      if (e.id === this.orderId) {
        this.setState({ cancelInProgress: true });
      }
    });

    this.listenTo(orderEvents, 'cancelOrderComplete cancelOrderFail', e => {
      if (e.id === this.orderId) {
        this.setState({ cancelInProgress: false });
      }
    });
  }

  className() {
    return 'rowLg clrTErr';
  }

  events() {
    return {
      'click .js-cancelOrder': 'onClickCancelOrder',
    };
  }

  onClickCancelOrder() {
    cancelOrder(this.orderId);
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/processingError.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
