import $ from 'jquery';
import app from '../../../../app';
import moment from 'moment';
import {
  acceptingPayout,
  acceptPayout,
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
        userCurrency: app.settings.get('localCurrency') || 'USD',
        showAcceptButton: false,
        acceptConfirmOn: false,
        paymentCoin: undefined,
        ...options.initialState,
      },
    });

    if (!options.orderId) {
      throw new Error('Please provide the orderId');
    }

    this.orderId = options.orderId;

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);

    this.listenTo(orderEvents, 'acceptingPayout', e => {
      if (e.id === this.orderId) {
        this.setState({ acceptInProgress: true });
      }
    });

    this.listenTo(orderEvents, 'acceptPayoutComplete acceptPayoutFail', e => {
      if (e.id === this.orderId) {
        this.setState({ acceptInProgress: false });
      }
    });

    this.listenTo(orderEvents, 'acceptPayoutComplete', e => {
      if (e.id === this.orderId) {
        this.setState({ showAcceptButton: false });
      }
    });
  }

  className() {
    return 'disputePayoutEvent rowLg';
  }

  events() {
    return {
      'click .js-acceptPayout': 'onClickAcceptPayout',
      'click .js-acceptPayoutConfirmBox': 'onClickAcceptPayoutConfirmedBox',
      'click .js-acceptPayoutConfirmed': 'onClickAcceptPayoutConfirmed',
      'click .js-acceptPayoutConfirmCancel': 'onClickAcceptPayoutConfirmCancel',
    };
  }

  onDocumentClick() {
    this.setState({ acceptConfirmOn: false });
  }

  onClickAcceptPayout() {
    recordEvent('OrderDetails_DisputeAcceptClick');
    this.setState({ acceptConfirmOn: true });
    return false;
  }

  onClickAcceptPayoutConfirmedBox() {
    // ensure event doesn't bubble so onDocumentClick doesn't
    // close the confirmBox.
    return false;
  }

  onClickAcceptPayoutConfirmCancel() {
    recordEvent('OrderDetails_DisputeAcceptCancel');
    this.setState({ acceptConfirmOn: false });
  }

  onClickAcceptPayoutConfirmed() {
    recordEvent('OrderDetails_DisputeAcceptConfirm');
    this.setState({ acceptConfirmOn: false });
    acceptPayout(this.orderId);
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/disputePayout.html', (t) => {
      this.$el.html(t({
        ...this._state,
        moment,
        acceptInProgress: acceptingPayout(this.orderId),
      }));
    });

    return this;
  }
}
