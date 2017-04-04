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

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.address) {
      addError('address', app.polyglot.t('spendModelErrors.provideAddress'));
    }

    if (typeof attrs.amount !== 'number') {
      addError('amount', app.polyglot.t('spendModelErrors.provideAmountNumber'));
    } else if (attrs.amount <= 0) {
      addError('amount', app.polyglot.t('spendModelErrors.amountGreaterThanZero'));
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
        amount = convertCurrency(amount, options.attrs.currency, 'BTC');
      }

      options.attrs.amount = decimalToInteger(amount, true);
      delete options.attrs.currency;
    }

    return super.sync(method, model, options);
  }
}
