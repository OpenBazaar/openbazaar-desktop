import bigNumber from 'bignumber.js';
import is from 'is_js';
import BaseModel from '../BaseModel';
import app from '../../app';
import { getCurrencyByCode } from '../../data/currencies';
import { ensureMainnetCode } from '../../data/walletCurrencies';
import {
  getCoinDivisibility,
  isValidCoinDivisibility,
  minValueByCoinDiv,
} from '../../utils/currency';
import {
  isValidStringBasedNumber,
  decimalPlaces,
} from '../../utils/number';

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
        addError('feeType', 'Unable to determine the coin divisibility for ' +
          `${attrs.currencyCode}.`);
      }
    }

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

    if (!isValidStringBasedNumber(attrs.amount)) {
      addError('amount', app.polyglot.t('fixedFeeModelErrors.noAmount'));
    } else if (isValidCoinDiv) {
      if (bigNumber(attrs.amount) < minValueByCoinDiv(coinDiv)) {
        addError('amount',
          app.polyglot.t('genericModelErrors.priceTooLow', {
            cur: attrs.currencyCode,
            min: minValueByCoinDiv(coinDiv, { returnInStandardNotation: true }),
          })
        );
      } else if (decimalPlaces(attrs.amount) > coinDiv) {
        addError(
          'amount',
          app.polyglot.t('genericModelErrors.fractionTooLow', {
            cur: attrs.currencyCode,
            coinDiv,
          })
        );
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
