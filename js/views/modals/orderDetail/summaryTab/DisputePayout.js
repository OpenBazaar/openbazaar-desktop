import $ from 'jquery';
import app from '../../../../app';
import _ from 'underscore';
import moment from 'moment';
import {
  acceptingPayout,
  acceptPayout,
  events as orderEvents,
} from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.orderId) {
      throw new Error('Please provide the orderId');
    }

    this.orderId = options.orderId;

    this._state = {
      userCurrency: app.settings.get('localCurrency') || 'USD',
      showAcceptButton: false,
      acceptConfirmOn: false,
      ...options.initialState || {},
    };

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
    this.setState({ acceptConfirmOn: true });
    return false;
  }

  onClickAcceptPayoutConfirmedBox() {
    // ensure event doesn't bubble so onDocumentClick doesn't
    // close the confirmBox.
    return false;
  }

  onClickAcceptPayoutConfirmCancel() {
    this.setState({ acceptConfirmOn: false });
  }

  onClickAcceptPayoutConfirmed() {
    this.setState({ acceptConfirmOn: false });
    acceptPayout(this.orderId);
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
