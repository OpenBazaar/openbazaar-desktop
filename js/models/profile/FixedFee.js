import BaseModel from '../BaseModel';
import app from '../../app';
import { getCurrencyByCode } from '../../data/currencies';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      currencyCode: 'BTC',
      amount: 0,
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.existy(attrs.currencyCode) || typeof attrs.currencyCode !== 'string') {
      addError('feeType', app.polyglot.t('moderatorModelErrors.noCurrency'));
    }

    if (attrs.currencyCode && !getCurrencyByCode(attrs.currencyCode)) {
      addError('feeType', app.polyglot.t('moderatorModelErrors.noCurrency'));
    }

    if (typeof attrs.amount !== 'number' || attrs.amount < 0) {
      addError('feeType', app.polyglot.t('moderatorModelErrors.noAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
