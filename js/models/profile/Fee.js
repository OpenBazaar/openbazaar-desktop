import _ from 'underscore';
import BaseModel from '../BaseModel';
import app from '../../app';
import FixedFee from './FixedFee';

export default class extends BaseModel {
  defaults() {
    return {
      feeType: 'PERCENTAGE',
      percentage: 0,
      fixedFee: new FixedFee(),
    };
  }

  get nested() {
    return {
      fixedFee: FixedFee,
    };
  }

  validate(attrs) {
    let errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const feeTypes = ['PERCENTAGE', 'FIXED', 'FIXED_PLUS_PERCENTAGE'];

    if (attrs.feeType === 'PERCENTAGE') {
      // remove fixed fee errors if the fixed fee isn't needed
      errObj = _.omit(errObj, (val, key) => key.startsWith('fixedFee'));
    }

    // feeType must exist and be one of the valid values
    if (!attrs.feeType || feeTypes.indexOf(attrs.feeType) === -1) {
      addError('feeType', app.polyglot.t('moderatorModelErrors.noFeeType'));
    }

    if (attrs.feeType === 'PERCENTAGE' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') {
      // is the percentage a number?
      if (typeof attrs.percentage !== 'number') {
        addError('feeType',
          app.polyglot.t('moderatorModelErrors.noPercentage'));
      }

      // is the percentage too low?
      if (attrs.percentage < 0) {
        addError('feeType',
          app.polyglot.t('moderatorModelErrors.percentageLow'));
      }

      // is the percentage too high?
      if (attrs.percentage > 100) {
        addError('feeType',
          app.polyglot.t('moderatorModelErrors.percentageHigh'));
      }

      // are there too many decimals? There should be 2 decimal places maximum.
      // move the decimal 2 places, ie 1.01 = 101.0, check if any are after the decimal.
      let decimals = attrs.percentage * 100;
      const integers = Math.trunc(decimals);
      decimals = decimals - integers;

      if (decimals > 0) {
        addError('feeType',
          app.polyglot.t('moderatorModelErrors.percentageDecimals'));
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}

