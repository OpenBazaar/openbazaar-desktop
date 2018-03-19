// import $ from 'jquery';
import app from '../../../app';
import '../../../lib/select2';
import cryptoListingCurs, { cryptoListingType } from '../../../models/listing/Metadata';
import { getCurrenciesSortedByName } from '../../../data/cryptoListingCurrencies';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a Listing model.');
    }

    super(options);
  }

  className() {
    return 'cryptoCurrencyType padSmKids padStackAll';
  }

  events() {
    return {
      // 'click .js-removeShippingOption': 'onClickRemoveShippingOption',
    };
  }

  render() {
    super.render();

    const coinTypes = getCurrenciesSortedByName()
      .map(coin => ({
        code: coin,
        name: app.polyglot.t(`cryptoCurrencies.${coin}`),
      }));

    const coinType = this.model.get('metadata')
      .get('coinType');

    // TODO todo TDO - test this scenariusz
    // TODO todo TDO - test this scenariusz
    // TODO todo TDO - test this scenariusz
    // TODO todo TDO - test this scenariusz
    // TODO todo TDO - test this scenariusz
    if (coinType && coinType.length && !cryptoListingCurs.includes(coinType)) {
      // If the listing has a coin type that's not in our crypto currency list,
      // we'll just plop it at the end of the list. It may that our crypto cur list
      // needs to be updated. If not and it's not a legitamate currency, the price
      // will show a warning indicating there is no exchange rate that the listing
      // would not be purchasable.
      coinTypes.push({
        code: coinType,
        name: '',
      });
    }

    loadTemplate('modals/editListing/cryptoCurrencyType.html', t => {
      this.$el.html(t({
        contractTypes: this.model.get('metadata').contractTypesVerbose,
        coinTypes,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this.$('#editListingCryptoContractType, #editListingCoinType').select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });
    });

    return this;
  }
}
