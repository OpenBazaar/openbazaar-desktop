import { decimalToInteger, convertCurrency, getExchangeRate } from '../../utils/currency';
import {
  getCurrencyByCode as getCryptoCurByCode,
  isSupportedWalletCur,
} from '../../data/walletCurrencies';
import { polyTFallback } from '../../utils/templateHelpers';
import app from '../../app';
import BaseModel from '../BaseModel';

class Spend extends BaseModel {
  url() {
    return app.getServerUrl('wallet/spend/');
  }

  defaults() {
    return {
      feeLevel: 'NORMAL',
      memo: '',
    };
  }

  get feeLevels() {
    return [
      'PRIORITY',
      'NORMAL',
      'ECONOMIC',
    ];
  }

  get amountInServerCur() {
    let cryptoAmount = 0;
    const amount = this.get('amount');

    if (typeof amount === 'number') {
      cryptoAmount = convertCurrency(amount, this.get('currency'), this.get('wallet'));
    }

    return cryptoAmount;
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const walletCurCode = attrs.wallet;
    let isWalletCurSupported = false;

    try {
      isWalletCurSupported = isSupportedWalletCur(walletCurCode);
    } catch (e) {
      // pass
    }

    if (!isWalletCurSupported) {
      addError('wallet', `"${attrs.wallet}" is not a supported wallet currency.`);
    } else {
      const walletCur = getCryptoCurByCode(walletCurCode);

      if (walletCur) {
        if (!attrs.address) {
          addError('address', app.polyglot.t('spendModelErrors.provideAddress'));
        } else if (typeof walletCur.isValidAddress === 'function' &&
          !walletCur.isValidAddress(attrs.address)) {
          addError('address', app.polyglot.t('spendModelErrors.invalidAddress',
            { cur: polyTFallback(`cryptoCurrencies.${walletCurCode}`, walletCurCode) }));
        }

        let exchangeRateAvailable = false;

        if (!attrs.currency) {
          addError('currency', 'Please provide a currency.');
        } else {
          exchangeRateAvailable = attrs.currency === attrs.wallet ||
            typeof getExchangeRate(attrs.currency) === 'number';

          if (!exchangeRateAvailable) {
            // TODO:
            // TODO:
            // TODO:
            // TODO: test this scenario.
            addError('currency', app.polyglot.t('spendModelErrors.missingExchangeRateData', {
              cur: attrs.currency,
              serverCur: walletCur.code,
            }));
          }
        }

        if (typeof attrs.amount !== 'number') {
          addError('amount', app.polyglot.t('spendModelErrors.provideAmountNumber'));
        } else if (attrs.amount <= 0) {
          addError('amount', app.polyglot.t('spendModelErrors.amountGreaterThanZero'));
        } else if (exchangeRateAvailable &&
          app.walletBalances) {
          const balanceMd = app.walletBalances.get(attrs.wallet);
          if (balanceMd && this.amountInServerCur >= balanceMd.get('confirmed')) {
            addError('amount', app.polyglot.t('spendModelErrors.insufficientFunds'));
          }
        }

        if (this.feeLevels.indexOf(attrs.feeLevel) === -1) {
          addError('feeLevel', `The fee level must be one of [${this.feeLevels}].`);
        }

        if (attrs.memo && typeof attrs.memo !== 'string') {
          addError('memo', 'If provided, the memo should be a string.');
        }
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || this.toJSON();
    const walletCur = getCryptoCurByCode(options.attrs.wallet);

    if (method === 'create' || method === 'update') {
      let amount = options.attrs.amount;

      if (options.attrs.currency !== walletCur.code) {
        amount = this.amountInServerCur;
      }

      options.attrs.amount = decimalToInteger(amount, walletCur.code);
      delete options.attrs.currency;
    }

    return super.sync(method, model, options);
  }

  parse(response) {
    const parsed = {
      ...response,
    };

    delete parsed.txid;
    delete parsed.amount;
    delete parsed.confirmedBalance;
    delete parsed.unconfirmedBalance;
    delete parsed.timestamp;
    return parsed;
  }
}

export default Spend;

/**
 * Use this function anytime you want to spend money from the internal wallet.
 * This function will ensure the balance is properly updated and the Wallet view
 * is informed so that it's UI could reflect the transaction.
 * @param {Object} fields An object containing the arguments to the spend call -
 * (address, amount and optionally currency, memo and feeLevel).
 * @returns {Object} The jqXhr representing the POST call to the server.
 */
export function spend(fields) {
  const attrs = {
    currency: app && app.settings && app.settings.get('localCurrency') || 'BTC',
    feeLevel: app &&
      app.localSettings && app.localSettings.get('defaultTransactionFee') || 'PRIORITY',
    memo: '',
    ...fields,
  };

  const spendModel = new Spend(attrs);
  const save = spendModel.save();

  if (!save) {
    Object.keys(spendModel.validationError)
      .forEach(errorKey => {
        throw new Error(`${errorKey}: ${spendModel.validationError[errorKey][0]}`);
      });
  } else {
    save.done(data => {
      if (app.walletBalances) {
        const balanceMd = app.walletBalances.get(this.get('wallet'));

        if (balanceMd) {
          balanceMd.set(
            app.walletBalance.parse({
              confirmed: data.confirmedBalance,
              unconfirmed: data.unconfirmedBalance,
            })
          );
        }
      }

      // const wallet = getWallet();

      // if (wallet && wallet.onSpendSuccess) {
      //   wallet.onSpendSuccess({
      //     address: spendModel.get('address'),
      //     ...data,
      //   });
      // }
    });
  }

  return save;
}
