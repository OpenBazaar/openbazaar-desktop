import app from '../../../app';
import '../../../lib/select2';
import {
  getExchangeRate,
  convertAndFormatCurrency,
  events as currencyEvents,
} from '../../../utils/currency';
import { getServerCurrency } from '../../../data/cryptoCurrencies';
import { getCurrenciesSortedByName } from '../../../data/cryptoListingCurrencies';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import CryptoTradingPair from '../../components/CryptoTradingPair';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a Listing model.');
    }

    super(options);

    this.listenTo(app.settings, 'change:localCurrency', () => {
      this.getCachedEl('.js-marketValueWrap')
        .html(this.tmplMarketValue({ getDataFromUi: true }));
    });
  }

  className() {
    return 'cryptoCurrencyType padSmKids padStackAll';
  }

  events() {
    return {
      'change #editListingCoinType': 'onChangeCoinType',
    };
  }

  onChangeCoinType(e) {
    this.getCachedEl('.js-quantityCoinType')
      .text(e.target.value);
    this.cryptoTradingPair.setState({
      toCur: this.getCachedEl('#editListingCoinType').val(),
    });
  }

  get currencies() {
    const coinTypes = getCurrenciesSortedByName()
      .map(coin => {
        const translationKey = `cryptoCurrencies.${coin}`;

        return {
          code: coin,
          name: app.polyglot.t(translationKey) === translationKey ?
            coin :
            app.polyglot.t('cryptoCurrenciesNameCodePairing', {
              name: app.polyglot.t(translationKey),
              code: coin,
            }),
        };
      });

    const coinType = this.model.get('metadata')
      .get('coinType');

    if (coinType && coinType.length && !coinTypes.find(coin => (coin.code === coinType))) {
      // If the listing has a coin type that's not in our crypto currency list,
      // we'll just plop it at the end of the list. It may be that our crypto cur list
      // needs to be updated and/or the exchange rate api is misbehaving. In either case, if the
      // exchange rate data is not available, a warning will be shown.
      coinTypes.push({
        code: coinType,
        name: coinType,
      });
    }

    return coinTypes;
  }

  tmplTypeHelper() {
    return app.polyglot.t('editListing.cryptoCurrencyType.helperType',
      { curCode: getServerCurrency().code });
  }

  render() {
    super.render();

    loadTemplate('modals/editListing/viewListingLinks.html', viewListingsT => {
      loadTemplate('modals/editListing/cryptoCurrencyType.html', t => {
        this.$el.html(t({
          contractTypes: this.model.get('metadata').contractTypesVerbose,
          coinTypes: this.currencies,
          helperType: this.tmplTypeHelper(),
          errors: this.model.validationError || {},
          viewListingsT,
          ...this.model.toJSON(),
        }));

        this.getCachedEl('#editListingCryptoContractType').select2({
          minimumResultsForSearch: Infinity,
        });

        this.getCachedEl('#editListingCoinType').select2({
          minimumResultsForSearch: 5,
          matcher: (params, data) => {
            if (!params.term || params.term.trim() === '') {
              return data;
            }

            const term = params.term
              .toUpperCase()
              .trim();

            if (
              data.text
                .toUpperCase()
                .includes(term) ||
              data.id.includes(term)
            ) {
              return data;
            }

            return null;
          },
        });

        if (this.cryptoTradingPair) this.cryptoTradingPair.remove();
        this.cryptoTradingPair = this.createChild(CryptoTradingPair, {
          className: 'cryptoTradingPairWrap row',
          initialState: {
            tradingPairClass: 'cryptoTradingPairLg rowSm',
            exchangeRateClass: 'clrT2 tx6',
            toCur: this.getCachedEl('#editListingCoinType').val(),
          },
        });
        this.getCachedEl('.js-cryptoTradingPairContainer').html(
          this.cryptoTradingPair.render().el
        );
      });
    });

    return this;
  }
}
