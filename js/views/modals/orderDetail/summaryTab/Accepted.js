import $ from 'jquery';
import moment from 'moment';
import {
  fulfillingOrder,
  refundingOrder,
  refundOrder,
  events as orderEvents,
} from '../../../../utils/order';
import { recordEvent } from '../../../../utils/metrics';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        infoText: '',
        showRefundButton: false,
        showFulfillButton: false,
        avatarHashes: {},
        refundConfirmOn: false,
        paymentCoin: undefined,
        ...options.initialState,
      },
    });

    if (!options.orderId) {
      throw new Error('Please provide the order id.');
    }

    this.orderId = options.orderId;

    this.listenTo(orderEvents, 'fulfillingOrder', e => {
      if (e.id === this.orderId) {
        this.setState({ fulfillInProgress: true });
      }
    });

    this.listenTo(orderEvents, 'fulfillOrderComplete fulfillOrderFail', e => {
      if (e.id === this.orderId) {
        this.setState({ fulfillInProgress: false });
      }
    });

    this.listenTo(orderEvents, 'refundingOrder', e => {
      if (e.id === this.orderId) {
        this.setState({ refundOrderInProgress: true });
      }
    });

    this.listenTo(orderEvents, 'refundOrderComplete refundOrderFail', e => {
      if (e.id === this.orderId) {
        this.setState({ refundOrderInProgress: false });
      }
    });

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'acceptedEvent rowLg';
  }

  events() {
    return {
      'click .js-fulfillOrder': 'onClickFulfillOrder',
      'click .js-refundOrder': 'onClickRefundOrder',
      'click .js-refundConfirmed': 'onClickRefundConfirmed',
      'click .js-refundConfirm': 'onClickRefundConfirmBox',
      'click .js-refundConfirmCancel': 'onClickRefundConfirmCancel',
    };
  }

  onClickRefundOrder() {
    recordEvent('OrderDetails_Refund');
    this.setState({ refundConfirmOn: true });
    return false;
  }

  onClickRefundConfirmBox() {
    // ensure event doesn't bubble so onDocumentClick doesn't
    // close the confirmBox.
    return false;
  }

  onClickRefundConfirmCancel() {
    recordEvent('OrderDetails_RefundCancel');
    this.setState({ refundConfirmOn: false });
  }

  onDocumentClick() {
    this.setState({ refundConfirmOn: false });
  }

  onClickRefundConfirmed() {
    recordEvent('OrderDetails_RefundConfirm');
    this.setState({ refundConfirmOn: false });
    refundOrder(this.orderId);
  }

  onClickFulfillOrder() {
    recordEvent('OrderDetails_Fulfill');
    this.trigger('clickFulfillOrder');
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/accepted.html', (t) => {
      this.$el.html(t({
        ...this._state,
        moment,
        fulfillInProgress: fulfillingOrder(this.orderId),
        refundOrderInProgress: refundingOrder(this.orderId),
      }));
    });

    return this;
  }
}
