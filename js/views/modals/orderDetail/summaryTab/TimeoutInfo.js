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
      awaitingBlockHeight: false,
      isFundingConfirmed: false,
      isCompletable: false,
      isDisputed: false,
      hasDisputeEscrowExpired: false,
      isPaymentClaimable: false,
      isPaymentFinalized: false,
      showDisputeBtn: false,
      showDiscussBtn: false,
      showResolveDisputeBtn: false,
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

    this.listenTo(orderEvents, 'resolveDisputeComplete', () => {
      this.setState({
        showResolveDisputeBtn: false,
      });
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
      'click .js-resolveDispute': 'onClickResolveDispute',
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

  onClickResolveDispute() {
    this.trigger('clickResolveDispute');
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
