// import $ from 'jquery';
// import _ from 'underscore';
// import moment from 'moment';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.orderId = options.orderId;

    this._state = {
      awaitingBlockHeight: false,
      showDisputeBtn: false,
      isFundingConfirmed: false,
      blocksRemaining: 0,
      invalidEscrowTimeout: false,
      ...options.initialState || {},
    };

    // this.listenTo(orderEvents, 'refundOrderComplete refundOrderFail', e => {
    //   if (e.id === this.orderId) {
    //     this.setState({ refundOrderInProgress: false });
    //   }
    // });
  }

  className() {
    return 'timeoutInfo rowLg';
  }

  events() {
    return {
      // 'click .js-fulfillOrder': 'onClickFulfillOrder',
    };
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/timeoutInfo.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
