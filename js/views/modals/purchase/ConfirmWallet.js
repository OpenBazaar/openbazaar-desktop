import _ from 'underscore';
import app from '../../../app';
import estimateFee from '../../../utils/fees';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

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
    this.fetchEstimatedFee = estimateFee(app.localSettings.get('defaultTransactionFee'))
      .done(data => {
        if (this.isRemoved()) return;
        this.fee = data;
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
