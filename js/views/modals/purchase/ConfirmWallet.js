import _ from 'underscore';
import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import { integerToDecimal } from '../../../utils/currency';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.displayCurrency) {
      throw new Error('Please provide a display currency.');
    }

    if (typeof options.amount !== 'number' &&
      typeof options.amount !== 'function') {
      throw new Error('The amount should be provided as a number or a function ' +
        'that returns one.');
    }

    super(options);
    this.options = options;
    this.fee = false;

    // re-render if the confirmed amount in the wallet changes
    this.listenTo(app.walletBalance, 'change:confirmed', () => this.render());

    // fetch the estimated fee and rerender when it returns
    this.fetchEstimatedFee = $.get(app.getServerUrl('wallet/estimatefee/?feeLevel=NORMAL'))
      .done(data => {
        if (this.isRemoved()) return;
        this.fee = integerToDecimal(data, true);
        this.render();
      })
      .fail(() => {
        if (this.isRemoved()) return;
        this.fee = false;
      });
  }

  className() {
    return 'confirmWallet';
  }

  events() {
    return {
      'click .js-confirmWalletCancel': 'clickWalletCancel',
      'click .js-confirmWalletConfirm': 'clickWalletConfirm',
    };
  }

  clickWalletCancel() {
    this.trigger('walletCancel');
  }

  clickWalletConfirm() {
    this.trigger('walletConfirm');
  }

  get amount() {
    return _.result(this.options, 'amount');
  }

  remove() {
    this.fetchEstimatedFee.abort();
    super.remove();
  }

  render() {
    loadTemplate('modals/purchase/confirmWallet.html', (t) => {
      this.$el.html(t({
        displayCurrency: this.options.displayCurrency,
        amount: this.amount,
        confirmedAmount: app.walletBalance.get('confirmed'),
        fee: this.fee,
      }));
    });

    return this;
  }
}
