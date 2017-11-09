import { isValidBitcoinAddress } from '../../utils/';
import { decimalToInteger, convertCurrency } from '../../utils/currency';
import { getWallet } from '../../utils/modalManager';
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

  get amountInBitcoin() {
    let btcAmount = 0;
    const amount = this.get('amount');

    if (typeof amount === 'number') {
      btcAmount = convertCurrency(amount, this.get('currency'), 'BTC');
    }

    return btcAmount;
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.address) {
      addError('address', app.polyglot.t('spendModelErrors.provideAddress'));
    } else if (!isValidBitcoinAddress(attrs.address)) {
      addError('address', app.polyglot.t('spendModelErrors.invalidAddress'));
    }

    if (typeof attrs.amount !== 'number') {
      addError('amount', app.polyglot.t('spendModelErrors.provideAmountNumber'));
    } else if (attrs.amount <= 0) {
      addError('amount', app.polyglot.t('spendModelErrors.amountGreaterThanZero'));
    } else if (this.amountInBitcoin >= app.walletBalance.get('confirmed')) {
      addError('amount', app.polyglot.t('spendModelErrors.insufficientFunds'));
    }

    if (this.feeLevels.indexOf(attrs.feeLevel) === -1) {
      addError('feeLevel', `The fee level must be one of [${this.feeLevels}].`);
    }

    if (attrs.memo && typeof attrs.memo !== 'string') {
      addError('memo', 'If provided, the memo should be a string.');
    }

    if (!attrs.currency) {
      addError('currency', 'Please provide a currency.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || this.toJSON();

    if (method === 'create' || method === 'update') {
      let amount = options.attrs.amount;

      if (options.attrs.currency !== 'BTC') {
        amount = this.amountInBitcoin;
      }

      options.attrs.amount = decimalToInteger(amount, options.attrs.currency);
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
      if (app.walletBalance) {
        app.walletBalance.set(
          app.walletBalance.parse({
            confirmed: data.confirmedBalance,
            unconfirmed: data.unconfirmedBalance,
          })
        );
      }

      const wallet = getWallet();

      if (wallet && wallet.onSpendSuccess) {
        wallet.onSpendSuccess({
          address: spendModel.get('address'),
          ...data,
        });
      }
    });
  }

  return save;
}
