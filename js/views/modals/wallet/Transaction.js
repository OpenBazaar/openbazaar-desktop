import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import { clipboard } from 'electron';
import { setTimeagoInterval } from '../../../utils/';
import { getFees } from '../../../utils/fees';
import { getServerCurrency } from '../../../data/cryptoCurrencies';
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
      'click .js-txidLink': 'onClickTxidLink',
      'click .js-retryFeeFetch': 'onClickRetryFeeFetch',
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

  onClickRetryFeeFetch(e) {
    this.fetchFees();
    e.stopPropagation();
  }

  onClickRetryConfirmed() {
    this.setState({
      retryInProgress: true,
      retryConfirmOn: false,
    });

    this.retryPost = $.post(app.getServerUrl(`wallet/bumpfee/${this.model.id}`))
      .always(() => {
        this.setState({
          retryInProgress: false,
        });
      }).fail((xhr) => {
        if (xhr.statusText === 'abort') return;
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('wallet.transactions.transaction.retryFailDialogTitle'),
          failReason);
      })
      .done(data => {
        this.trigger('retrySuccess', { data });
        this.model.set('feeBumped', true);
      });
  }

  onClickRetryPmt(e) {
    this.setState({
      retryConfirmOn: true,
    });

    this.fetchFees();
    e.stopPropagation();
  }

  onClickRetryConfirmCancel() {
    this.closeRetryConfirmBox();
  }

  onClickTxidLink(e) {
    this.setState({
      copiedIndicatorOn: true,
    });

    clipboard.writeText($(e.target).text());
    clearTimeout(this.copiedIndicatorTimeout);

    this.copiedIndicatorTimeout = setTimeout(() => {
      this.setState({
        copiedIndicatorOn: false,
      });
    }, 1000);
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

  fetchFees() {
    this.setState({
      retryConfirmOn: true,
      fetchingEstimatedFee: true,
      fetchError: '',
      fetchFailed: false,
    });

    getFees().done(fees => {
      if (this.isRemoved()) return;
      this.setState({
        fetchingEstimatedFee: false,
        // server doubles the fee when bumping
        estimatedFee: (getServerCurrency().feeBumpTransactionSize * fees.priority * 2) /
          getServerCurrency().baseUnit,
      });
    }).fail(xhr => {
      if (this.isRemoved()) return;
      this.setState({
        fetchingEstimatedFee: false,
        fetchFailed: true,
        fetchError: xhr && xhr.responseJSON && xhr.responseJSON.reason || '',
      });
    });
  }

  closeRetryConfirmBox() {
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
    $(document).off('click', this.boundDocClick);
    this.timeAgoInterval.cancel();
    clearTimeout(this.copiedIndicatorTimeout);
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
        walletBalance: app.walletBalance.toJSON(),
        ...this._state,
      }));
    });

    this._$retryPmtConfirmed = null;

    return this;
  }
}
