import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      ...options.initialState || {},
    };
  }

  className() {
    return 'sendConfirm';
  }

  events() {
    return {
      'click .js-btnConfirmSend': 'onClickSend',
      'click .js-sendConfirmCancel': 'onClickCancel',
    };
  }

  onClickSend() {
    this.trigger('clickSend');
  }

  onClickCancel() {
    this.trigger('clickCancel');
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
    if (this.retryPost) this.retryPost.abort();
    $(document).off(null, this.boundDocClick);
    this.timeAgoInterval.cancel();
    clearTimeout(this.copiedIndicatorTimeout);
    if (this.getFeeLevel) this.getFeeLevel.abort();
    super.remove();
  }

  render() {
    this.renderedTimeAgo = moment(this.model.get('timestamp')).fromNow();

    loadTemplate('modals/wallet/transaction.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        userCurrency: app.settings.get('localCurrency'),
        timeAgo: this.renderedTimeAgo,
        isTestnet: !!app.serverConfig.testnet,
        walletBalance: app.walletBalance.get('confirmed') || 0,
        ...this._state,
      }));
    });

    this._$retryPmtConfirmed = null;

    return this;
  }
}
