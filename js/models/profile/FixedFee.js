import BaseModel from '../BaseModel';
import app from '../../app';
import { getListofCurrencies } from '../../data/currencies';
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
      addError('feeType', app.polyglot.t('settings.moderationTab.moderatorModelErrors.noCurrency'));
    }

    // make sure currency is a valid value
    if (getListofCurrencies().indexOf(attrs.currencyCode) === -1) {
      addError('feeType', app.polyglot.t('settings.moderationTab.moderatorModelErrors.noCurrency'));
    }

    if (typeof attrs.amount !== 'number' || attrs.amount < 0) {
      addError('feeType', app.polyglot.t('settings.moderationTab.moderatorModelErrors.noAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
