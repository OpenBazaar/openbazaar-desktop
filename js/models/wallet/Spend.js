import { isValidBitcoinAddress } from '../../utils/';
import { decimalToInteger, convertCurrency } from '../../utils/currency';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
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

      options.attrs.amount = decimalToInteger(amount, true);
      delete options.attrs.currency;
    }

    return super.sync(method, model, options);
  }
}
