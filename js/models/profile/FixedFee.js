import BaseModel from '../BaseModel';
import app from '../../app';
import { integerToDecimal } from '../../utils/currency';
import { getCurrenciesSortedByCode } from '../../data/currencies';

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

    const currencies = getCurrenciesSortedByCode();

    if (typeof attrs.currencyCode !== 'string') {
      addError('feeTypeNoCurrency', app.polyglot.t('settings.moderationTab.errors.noCurrency'));
    }

    // make sure currency is a valid value
    if (currencies.indexOf(attrs.currencyCode) === -1) {
      addError('feeTypeNoCurrency', app.polyglot.t('settings.moderationTab.errors.noCurrency'));
    }

    if (typeof attrs.amount !== 'number' || attrs.amount < 0) {
      addError('feeTypeNoAmount', app.polyglot.t('settings.moderationTab.errors.noAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
