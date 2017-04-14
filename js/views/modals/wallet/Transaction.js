// import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import { setTimeagoInterval } from '../../../utils/';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model) {
      throw new Error('Please provide a Transaction model.');
    }

    if (typeof options.getFeeLevel !== 'function') {
      throw new Error('Please provide a function that returns the data from the estimatefee api');
    }

    this._state = {
      ...options.initialState || {},
    };

    this.listenTo(this.model, 'change', () => this.render());
    this.timeAgoInterval = setTimeagoInterval(this.model.get('timestamp'), () => {
      const timeAgo = moment(this.model.get('timestamp')).fromNow();
      if (timeAgo !== this.renderedTimeAgo) this.render();
    });

    // $(document).on('click', this.onDocumentClick.bind(this));
  }

  className() {
    return 'transaction';
  }

  events() {
    return {
      'click .js-retryPmt': 'onClickRetryPmt',
      'click .js-retryConfirmCancel': 'onClickRetryConfirmCancel',
    };
  }

  // onDocumentClick(e) {
  //   if (this.isSendConfirmOn() &&
  //     !($.contains(this.$sendConfirm[0], e.target) ||
  //       e.target === this.$sendConfirm[0])) {
  //     this.setSendConfirmOn(false);
  //   }
  // }

  onClickRetryPmt() {
    if (this.getFeeLevel) this.getFeeLevel.abort();
    this.getFeeLevel = this.options.getFeeLevel('NORMAL');

    const state = {
      retryConfirmOn: true,
    };

    if (this.getFeeLevel.state() === 'pending') {
      this.setState({
        ...state,
        fetchingEstimatedFee: true,
      });
    }

    this.getFeeLevel.done(fee => {
      this.setState({
        ...state,
        fetchingEstimatedFee: false,
        // Fee is per byte in satoshi. Estimated transaction is 200 bytes, then
        // we'll convert from Satoshi to BTC
        estimatedFee: fee * 200 / 100000000,
      });
    });
  }

  onClickRetryConfirmCancel() {
    this.closeRetryConfirmBox();
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  closeRetryConfirmBox() {
    if (this.getFeeLevel) this.getFeeLevel.abort();
    this.setState({
      retryConfirmOn: false,
      fetchingEstimatedFee: false,
    });
  }

  remove() {
    this.timeAgoInterval.cancel();
    super.remove();
  }

  render() {
    this.renderedTimeAgo = moment(this.model.get('timestamp')).fromNow();

    loadTemplate('modals/wallet/transaction.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        userCurrency: app.settings.get('localCurrency'),
        timeAgo: this.renderedTimeAgo,
        isTestnet: !!app.testnet,
        ...this._state,
      }));
    });

    return this;
  }
}
