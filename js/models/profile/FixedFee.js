import is from 'is_js';
import BaseModel from '../BaseModel';
import app from '../../app';
import { getCurrencyByCode } from '../../data/currencies';
import { getCoinDivisibility } from '../../utils/currency';

export default class extends BaseModel {
  defaults() {
    return {
      currencyCode: 'USD',
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
      addError('feeType', app.polyglot.t('fixedFeeModelErrors.noCurrency'));
    } else {
      try {
        getCoinDivisibility(attrs.currencyCode);
      } catch (e) {
        // this would really be a developer error to allow an unsupported currency
        // code in the list
        console.error(`the sam is patt => ${attrs.currencyCode}`);
        console.error(e);
        addError('feeType', 'Unable to determine the coin divisibility for ' +
          `${attrs.currencyCode}.`);
      }
    }

    if (typeof attrs.currencyCode !== 'string' ||
      !attrs.currencyCode ||
      !getCurrencyByCode(attrs.currencyCode)) {
      addError('feeType', app.polyglot.t('fixedFeeModelErrors.noCurrency'));
    }

    if (typeof attrs.amount !== 'number' || attrs.amount < 0) {
      addError('feeType', app.polyglot.t('fixedFeeModelErrors.noAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
