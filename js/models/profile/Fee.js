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
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.feeType) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.noFeeType'));
    }

    if ((attrs.feeType === 'PERCENTAGE' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.percentage) {
      addError('feeTypeNoPercent', app.polyglot.t('settings.moderationTab.errors.noPercentage'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}

/*
 fee: {
   feeType: "FIXED / PERCENTAGE / FIXED_PLUS_PERCENTAGE",
   fixedFee: { // do not include if type is percentage
     currencyCode: 3 character stringify,
     amount: Number
   },
   percentage: Number // do not include if type is fixed
 },
 */
