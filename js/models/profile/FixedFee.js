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

    let coinDiv;

    if (
      typeof attrs.currencyCode !== 'string' ||
      !attrs.currencyCode ||
      !getCurrencyByCode(attrs.currencyCode)
    ) {
      addError('currencyCode', app.polyglot.t('fixedFeeModelErrors.noCurrency'));
    } else {
      try {
        coinDiv = getCoinDivisibility(attrs.currencyCode);
      } catch (e) {
        // pass
      }

      this.validateCurrencyAmount(
        {
          currency: attrs.currencyCode,
          divisibility: coinDiv,
          amount: attrs.amount,
        },
        addError,
        errObj,
        'amount',
        {
          translations: {
            range: 'fixedFeeModelErrors.amountGreaterThanZero',
            type: 'fixedFeeModelErrors.fixedFeeAsNumber',
            required: 'fixedFeeModelErrors.fixedFeeAsNumber',
          },
        }
      );
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
