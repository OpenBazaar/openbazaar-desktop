import {
  releasingEscrow,
  releaseEscrow,
  events as orderEvents,
} from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.orderId) {
      throw new Error('Please provide an orderId');
    }

    this.orderId = options.orderId;

    this._state = {
      isClaimingPayment: releasingEscrow(this.orderId),
      ...options.initialState || {},
    };

    this.listenTo(orderEvents, 'releasingEscrow', e => {
      if (e.id === this.orderId) {
        this.setState({ isClaimingPayment: true });
      }
    });

    this.listenTo(orderEvents, 'releaseEscrowComplete releaseEscrowFail', e => {
      if (e.id === this.orderId) {
        this.setState({ isClaimingPayment: false });
      }
    });
  }

  className() {
    return 'timeoutInfo rowLg';
  }

  events() {
    return {
      'click .js-disputeOrder': 'onClickDisputeOrder',
      'click .js-claimPayment': 'onClickClaimPayment',
      'click .js-discussOrder': 'onClickDiscussOrder',
    };
  }

  onClickDisputeOrder() {
    this.trigger('clickDisputeOrder');
  }

  onClickClaimPayment() {
    releaseEscrow(this.orderId);
  }

  onClickDiscussOrder() {
    this.trigger('clickDiscussOrder');
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
