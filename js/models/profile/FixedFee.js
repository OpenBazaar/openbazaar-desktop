import BaseModel from '../BaseModel';
import app from '../../app';
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

    if (is.not.string(attrs.currencyCode)) {
      // the user should never see this error
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNoCurrency'));
    }

    if (is.not.number(attrs.amount)) {
      // the user should never see this error
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNoAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
