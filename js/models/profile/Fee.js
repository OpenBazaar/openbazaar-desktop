import BaseModel from '../BaseModel';
import app from '../../app';

export default class extends BaseModel {
  defaults() {
    return {
      feeType: 'PERCENTAGE',
      percentage: 0,
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.feeType) {
      // the user should never see this error
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.noFeeType'));
    }

    if ((attrs.feeType === 'FIXED' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.fixedFee) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNofee'));
    }

    if ((attrs.feeType === 'FIXED' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.fixedFee.currencyCode) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNoCurrency'));
    }

    if ((attrs.feeType === 'FIXED' || attrs.feeType === 'FIXED_PLUS_PERCENTAGE') &&
      !attrs.fixedFee.amount) {
      addError('feeType', app.polyglot.t('settings.moderationTab.errors.fixedNoAmount'));
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
