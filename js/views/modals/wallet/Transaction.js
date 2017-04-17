import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import { setTimeagoInterval } from '../../../utils/';
import app from '../../../app';
import { openSimpleMessage } from '../../modals/SimpleMessage';
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

    this.boundDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundDocClick);
  }

  className() {
    return 'transaction';
  }

  events() {
    return {
      'click .js-retryPmt': 'onClickRetryPmt',
      'click .js-retryConfirmCancel': 'onClickRetryConfirmCancel',
      'click .js-btnConfirmRetrySend': 'onClickRetryConfirmed',
    };
  }

  onDocumentClick(e) {
    if (this.getState().retryConfirmOn &&
      !($.contains(this.$retryPmtConfirmedBox[0], e.target) ||
        e.target === this.$retryPmtConfirmedBox[0])) {
      this.setState({
        retryConfirmOn: false,
      });
    }
  }

  onClickRetryConfirmed() {
    this.setState({
      retryInProgress: true,
      retryConfirmOn: false,
    });

    $.post(app.getServerUrl(`wallet/bumpfee/${this.model.id}`))
      .always(() => {
        this.setState({
          retryInProgress: false,
        });
      }).fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('wallet.transactions.transaction.retryFailDialogTitle'),
          failReason);
      })
      .done(data => {
        this.trigger('retrySuccess', { data });
        this.model.set('canBumpFee', false);
      });
  }

  onClickRetryPmt() {
    if (this.getFeeLevel) this.getFeeLevel.abort();
    this.getFeeLevel = this.options.getFeeLevel('PRIORITY');

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
        estimatedFee: this.feeToBtc(fee),
      });
    });

    // don't bubble to the document click handler
    return false;
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

  feeToBtc(fee) {
    // We'll approximateally match the server's algorythm to estimate the fee.
    // Fee is per byte in satoshi. A estimated average transaction is 200 bytes.
    // So we'll multiply the fee by 200, divide by a 100 mil to get BTC and
    // then multiply by 2 (the server bumps the fee by doubling it.)
    return fee * 200 / 100000000 * 2;
  }

  closeRetryConfirmBox() {
    if (this.getFeeLevel) this.getFeeLevel.abort();
    this.setState({
      retryConfirmOn: false,
      fetchingEstimatedFee: false,
    });
  }

  get $retryPmtConfirmedBox() {
    return this._$retryPmtConfirmed ||
      (this._$retryPmtConfirmed = this.$('.js-retryPmtConfirmed'));
  }

  remove() {
    $(document).off(null, this.boundDocClick);
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

    this._$retryPmtConfirmed = null;

    return this;
  }
}
