import BaseModel from '../BaseModel';
import app from '../../app';
import FixedFee from './FixedFee';

export default class extends BaseModel {
  defaults() {
    return {
      feeType: 'PERCENTAGE',
      percentage: 0,
    };
  }

  get nested() {
    return {
      fixedFee: FixedFee,
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.feeType) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.noFeeType'));
    }

    if ((attrs.feeType === 'FIXED' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.fixedFee) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNofee'));
    }

    if ((attrs.feeType === 'PERCENTAGE' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.percentage) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.percentageNoPercentage'));
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
