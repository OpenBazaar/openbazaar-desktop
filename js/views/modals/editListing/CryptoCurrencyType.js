import app from '../../../app';
import '../../../lib/select2';
// import { getCurrenciesSortedByName } from '../../../data/cryptoListingCurrencies';
import { supportedWalletCurs } from '../../../data/walletCurrencies';
import { isJQPromise } from '../../../utils/object';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import CryptoTradingPair from '../../components/CryptoTradingPair';
import CryptoCurrencyTradeField from './CryptoCurrencyTradeField';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a Listing model.');
    }

    if (!isJQPromise(options.getCoinTypes)) {
      throw new Error('Please provide getCoinTypes as a jQuery promise.');
    }

    super(options);
    this.getCoinTypes = options.getCoinTypes;
    this.receiveCurs = supportedWalletCurs();
    const receiveCur = this.model.get('metadata')
      .get('acceptedCurrencies')[0];


    if (!this.receiveCurs.includes(receiveCur)) {
      // if the model has the receiving currency set to an unsupported cur,
      // we'll manually add that to the list of available options. Upon a
      // a save attempt, the user will be presented with an error prompting them
      // to select a valid currency.
      this.receiveCurs.push(receiveCur);
      this.unsupportedReceiveCur = receiveCur;
    }

    this.receiveCurs = this.receiveCurs.map(cur => ({
      code: cur,
      name: app.polyglot.t(`cryptoCurrencies.${cur}`, {
        _: cur,
      }),
    }));

    this.tradeField = this.createChild(CryptoCurrencyTradeField, {
      select2Opts: this.tradeSelect2Opts,
      initialState: {
        isFetching: this.getCoinTypes.state() === 'pending',
      },
    });

    this.getCoinTypes.done(curs => {
      this.tradeField.setState({
        curs,
        isFetching: false,
        selected: this.model.get('metadata')
          .get('acceptedCurrencies')[0] || curs[0],
      });
    });

    this.tradeField.render();

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
      'change #editListingCryptoReceive': 'onChangeReceiveCur',
    };
  }

  onChangeCoinType(e) {
    this.getCachedEl('.js-quantityCoinType')
      .text(e.target.value);
    this.cryptoTradingPair.setState({
      toCur: this.getCachedEl('#editListingCoinType').val(),
    });
  }

  onChangeReceiveCur() {
    if (this.unsupportedReceiveCur) {
      this.receiveCurs = this.receiveCurs.filter(
        cur => cur.code === this.unsupportedReceiveCur);
      this.unsupportedReceiveCur = null;
    }
  }

  // get currencies() {
  //   // const coinTypes = getCurrenciesSortedByName()
  //   //   .map(coin => {
  //   //     const translationKey = `cryptoCurrencies.${coin}`;

  //   //     return {
  //   //       code: coin,
  //   //       name: app.polyglot.t(translationKey) === translationKey ?
  //   //         coin :
  //   //         app.polyglot.t('cryptoCurrenciesNameCodePairing', {
  //   //           name: app.polyglot.t(translationKey),
  //   //           code: coin,
  //   //         }),
  //   //     };
  //   //   });

  //   getCurrenciesSortedByName()
  //     .done(curs => {
  //       console.time('mapSizzle');
  //       curs.map(coin => {
  //         const translationKey = `cryptoCurrencies.${coin}`;

  //         return {
  //           code: coin,
  //           name: app.polyglot.t(translationKey) === translationKey ?
  //             coin :
  //             app.polyglot.t('cryptoCurrenciesNameCodePairing', {
  //               name: app.polyglot.t(translationKey),
  //               code: coin,
  //             }),
  //         };
  //       });
  //       console.timeEnd('mapSizzle');
  //     });

  //   return ['howdy', 'skipper'];

  //   const coinType = this.model.get('metadata')
  //     .get('coinType');

  //   if (coinType && coinType.length && !coinTypes.find(coin => (coin.code === coinType))) {
  //     // If the listing has a coin type that's not in our crypto currency list,
  //     // we'll just plop it at the end of the list. It may be that our crypto cur list
  //     // needs to be updated and/or the exchange rate api is misbehaving. In either case, if the
  //     // exchange rate data is not available, a warning will be shown.
  //     coinTypes.push({
  //       code: coinType,
  //       name: coinType,
  //     });
  //   }

  //   return coinTypes;
  // }

  get defaultFromCur() {
    return this.model.get('metadata').get('coinType') ||
      this.coinTypes ? this.coinTypes[0].code : '';
  }

  get tradeSelect2Opts() {
    return {
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
    };
  }

  render() {
    super.render();

    loadTemplate('modals/editListing/viewListingLinks.html', viewListingsT => {
      loadTemplate('modals/editListing/cryptoCurrencyType.html', t => {
        this.$el.html(t({
          contractTypes: this.model.get('metadata').contractTypesVerbose,
          coinTypes: this.coinTypes,
          receiveCurs: this.receiveCurs,
          errors: this.model.validationError || {},
          viewListingsT,
          ...this.model.toJSON(),
        }));

        this.getCachedEl('#editListingCryptoContractType').select2({
          minimumResultsForSearch: Infinity,
        });

        this.getCachedEl('#editListingCryptoReceive').select2(this.tradeSelect2Opts);

        this.tradeField.delegateEvents();
        this.getCachedEl('.js-cryptoCurrencyTradeContainer').html(this.tradeField.el);

        const showCryptoTradingPair = !!(this.coinTypes && this.coinTypes.length);
        if (this.cryptoTradingPair) this.cryptoTradingPair.remove();
        this.cryptoTradingPair = this.createChild(CryptoTradingPair, {
          className: 'cryptoTradingPairWrap row',
          initialState: {
            tradingPairClass: 'cryptoTradingPairLg rowSm',
            exchangeRateClass: 'clrT2 tx6',
            fromCur: 'BTC',
            toCur: showCryptoTradingPair ?
              this.getCachedEl('#editListingCoinType').val() : 'BTC',
          },
        });
        this.getCachedEl('.js-cryptoTradingPairContainer').html(
          this.cryptoTradingPair.render().el
        );
        this.cryptoTradingPair.$el.toggleClass('invisible', !showCryptoTradingPair);
      });
    });

    return this;
  }
}
