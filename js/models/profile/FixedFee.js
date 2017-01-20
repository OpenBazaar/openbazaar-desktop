import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';
import { integerToDecimal } from '../../utils/currency';

export default class extends BaseModel {
  defaults() {
    return {
      currencyCode: 'BTC',
      amount: 0,
    };
  }

  parse(response) {
    response.amount = integerToDecimal(response.amound, response.currencyCode === 'BTC');
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.string(attrs.currencyCode)) {
      // the user should never see this error
      addError('feeTypeNoCurrency', app.polyglot.t('settings.moderationTab.errors.noCurrency'));
    }

    if (is.not.existy(attrs.amount)) {
      // the user should never see this error
      addError('feeTypeNoAmount', app.polyglot.t('settings.moderationTab.errors.noAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
