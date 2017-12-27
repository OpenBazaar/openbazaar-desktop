import app from '../../../app';
import '../../../lib/select2';
import { getCurrenciesSortedByCode } from '../../../data/currencies';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
      ...options,
    };

    if (typeof opts.unsupportedCurrency !== 'string') {
      throw new Error('Please provide the unsupported currency code as a string.');
    }

    super(opts);
    this.unsupportedCurrency = opts.unsupportedCurrency;
  }

  className() {
    return `${super.className()} modalTop modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-okCurrencySet': 'onClickOkCurrencySet',
      ...super.events(),
    };
  }

  onClickOkCurrencySet() {
    this.close();
  }

  getCurrency() {
    return this.getCachedEl('.js-currencyList')[0].value;
  }

  render() {
    super.render();
    this.curList = this.curList || getCurrenciesSortedByCode();

    loadTemplate('modals/editListing/unsupportedCurrency.html', (t) => {
      this.$el.html(t({
        unsupportedCurrency: this.unsupportedCurrency,
        curList: this.curList,
        userCurrency: app.settings.get('localCurrency'),
      }));
      super.render();

      this.getCachedEl('.js-currencyList').select2();
    });

    return this;
  }
}

