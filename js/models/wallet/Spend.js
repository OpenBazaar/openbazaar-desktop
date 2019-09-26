import bigNumber from 'bignumber.js';
import {
  convertCurrency,
  getExchangeRate,
  decimalToCurDef,
  getCoinDivisibility,
  isValidCoinDivisibility,
  minValueByCoinDiv,
} from '../../utils/currency';
import {
  isValidNumber,
  toStandardNotation,
  decimalPlaces,
} from '../../utils/number';
import {
  getCurrencyByCode as getWalletCurByCode,
  isSupportedWalletCur,
  ensureMainnetCode,
} from '../../data/walletCurrencies';
import app from '../../app';
import BaseModel from '../BaseModel';

const getWalletSpendUrl = () => app.getServerUrl('wallet/spend/');
const getOrderSpendUrl = () => app.getServerUrl('ob/orderspend/');

class Spend extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.url = options.url || this.url;
  }

  url() {
    return getWalletSpendUrl();
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

  getAmountInWalletCur() {
    this._amountInWalletCurCache =
      this._amountInWalletCurCache || {};
    const amount = this.get('amount');
    const cur = this.get('currency');
    const wallet = this.get('wallet');
    const cacheKey = `${amount}-${cur}-${wallet}`;
    const cachedVal = this._amountInWalletCurCache[cacheKey];
    let converted;

    if (cachedVal !== 'undefined') {
      converted = convertCurrency(amount, cur, wallet);
      this._amountInWalletCurCache[cacheKey] = converted;
    }

    return converted;
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
      const walletCur = getWalletCurByCode(walletCurCode);

      if (walletCur) {
        if (!attrs.address) {
          addError('address', app.polyglot.t('spendModelErrors.provideAddress'));
        } else if (typeof walletCur.isValidAddress === 'function' &&
          !walletCur.isValidAddress(attrs.address)) {
          const cur = app.polyglot.t(
            `cryptoCurrencies.${walletCurCode}`,
            { _: walletCurCode }
          );

          addError('address', app.polyglot.t('spendModelErrors.invalidAddress', { cur }));
        }

        let exchangeRatesAvailable = false;

        if (!attrs.currency) {
          addError('currency', 'Please provide a currency.');
        } else {
          exchangeRatesAvailable =
            ensureMainnetCode(attrs.currency) === ensureMainnetCode(attrs.wallet) ||
              (typeof getExchangeRate(attrs.currency) === 'number' &&
                typeof getExchangeRate(attrs.wallet) === 'number');

          if (!exchangeRatesAvailable) {
            addError('currency', app.polyglot.t('spendModelErrors.missingExchangeRateData', {
              cur: attrs.currency,
              serverCur: walletCur.code,
            }));
          }
        }


        console.log('test all these validations');
        if (
          !isValidNumber(attrs.amount, {
            allowNumber: false,
            allowBigNumber: false,
          })
        ) {
          addError('amount', app.polyglot.t('spendModelErrors.provideAmountNumber'));
        } else if (attrs.amount <= 0) {
          addError('amount', app.polyglot.t('spendModelErrors.amountGreaterThanZero'));
        } else {
          const amountInWalletCur = this.getAmountInWalletCur();
          let coinDiv;
          let isValidCoinDiv;

          try {
            coinDiv = getCoinDivisibility(attrs.wallet);
            [isValidCoinDiv] =
              isValidCoinDivisibility(coinDiv);
          } catch (e) {
            // pass
          }

          let foundErr = false;

          if (isValidCoinDiv) {
            if (ensureMainnetCode(attrs.wallet) !== ensureMainnetCode(attrs.currency)) {
              console.log('no less than on big number instance');
              if (bigNumber(amountInWalletCur) < minValueByCoinDiv(coinDiv)) {
                addError('amount', app.polyglot.t('spendModelErrors.convertedAmountTooLow', {
                  min: toStandardNotation(minValueByCoinDiv(coinDiv)),
                  walletCur: attrs.wallet,
                  convertedAmount: toStandardNotation(amountInWalletCur),
                }));
                foundErr = true;
              }
            } else {
              console.log('no less than on big number instance');
              if (bigNumber(amountInWalletCur) < minValueByCoinDiv(coinDiv)) {
                addError('amount', app.polyglot.t('spendModelErrors.amountTooLow', {
                  cur: attrs.wallet,
                  min: toStandardNotation(minValueByCoinDiv(coinDiv)),
                }));
                foundErr = true;
              } else if (decimalPlaces(amountInWalletCur) > coinDiv) {
                addError(
                  'item.cryptoQuantity',
                  app.polyglot.t('genericModelErrors.fractionTooLow', {
                    cur: attrs.wallet,
                    coinDiv,
                  })
                );
                foundErr = true;
              }
            }
          }

          if (
            !foundErr &&
            exchangeRatesAvailable &&
            app.walletBalances
          ) {
            const balanceMd = app.walletBalances.get(attrs.wallet);

            if (
              balanceMd &&
              bigNumber(this.getAmountInWalletCur())
                .gte(balanceMd.get('confirmed'))
            ) {
              addError('amount', app.polyglot.t('spendModelErrors.insufficientFunds'));
            }
          }
        }

        if (this.feeLevels.indexOf(attrs.feeLevel) === -1) {
          addError('feeLevel', `The fee level must be one of [${this.feeLevels}].`);
        }

        if (attrs.memo && typeof attrs.memo !== 'string') {
          addError('memo', 'If provided, the memo should be a string.');
        }

        if (
          this.url === getOrderSpendUrl() &&
          (
            typeof attrs.orderId !== 'string' ||
            !attrs.orderId
          )
        ) {
          addError('orderId', 'Please provide an orderId.');
        }
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || this.toJSON();

    // This will be overridden by decimalToCurDef below, unless that throws an exception
    // (which should be rare). In that case we'll let the bool go through and have the
    // server reject it, since otherwise it's not easy for sync to kick back an error
    // that makes it back to the Model.save() call which initiated the sync call
    options.attrs.amount = false;

    delete options.attrs.currency;

    try {
      options.attrs = {
        ...options.attrs,
        ...(
          decimalToCurDef(
            this.getAmountInWalletCur(),
            options.attrs.wallet
          )
        ),
      };
    } catch (e) {
      console.error(`Unable to create the amount object for spending: ${e.message}`);
    }

    delete options.attrs.wallet;
    delete options.attrs.cid;

    return super.sync(method, model, {
      ...options,
      success: () => {
        // no-op - we just don't want backbone's standard success handler
        // to execute since it overwrites the model with attributes returned
        // by the server which have a different format than ours.
      },
    });
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
export function _spend(fields, options = {}) {
  const attrs = {
    currency: app && app.settings && app.settings.get('localCurrency') || 'BTC',
    feeLevel: app &&
      app.localSettings && app.localSettings.get('defaultTransactionFee') || 'PRIORITY',
    memo: '',
    ...fields,
  };

  const spendModel = new Spend(attrs, options);
  const save = spendModel.save();

  if (!save) {
    Object.keys(spendModel.validationError)
      .forEach(errorKey => {
        throw new Error(`${errorKey}: ${spendModel.validationError[errorKey][0]}`);
      });
  } else {
    save.done(data => {
      if (app.walletBalances) {
        const coinType = spendModel.get('wallet');
        const balanceMd = app.walletBalances.get(spendModel.get('wallet'));

        if (balanceMd) {
          balanceMd.set(
            balanceMd.parse({
              code: coinType,
              confirmed: data.confirmedBalance,
              unconfirmed: data.unconfirmedBalance,
              currency: data.currency,
            })
          );
        }
      }
    });
  }

  return save;
}

export function spend(fields) {
  return _spend(fields, { url: getWalletSpendUrl() });
}

export function orderSpend(fields) {
  return _spend(fields, { url: getOrderSpendUrl() });
}
