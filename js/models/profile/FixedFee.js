// import bigNumber from 'bignumber.js';
// import is from 'is_js';
import BaseModel from '../BaseModel';
import app from '../../app';
import { getCurrencyByCode } from '../../data/currencies';
import { ensureMainnetCode } from '../../data/walletCurrencies';
import {
  getCoinDivisibility,
  isValidCoinDivisibility,
  // minValueByCoinDiv,
} from '../../utils/currency';
// import {
//   isValidStringBasedNumber,
//   decimalPlaces,
// } from '../../utils/number';

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

    let isValidCoinDiv = false;
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
        [isValidCoinDiv] =
          isValidCoinDivisibility(coinDiv);
      } catch (e) {
        // pass
      }

      if (!isValidCoinDiv) {
        addError('currencyCode',
          app.polyglot.t('fixedFeeModelErrors.invalidCoinDiv', {
            cur: ensureMainnetCode(attrs.currencyCode),
          })
        );
      }
    }

    this.validateCurrencyAmount(
      attrs.amount,
      addError,
      errObj,
      'amount',
      {
        cur: attrs.currencyCode,
        coinDiv,
      }
    );

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
