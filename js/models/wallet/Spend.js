// import { integerToDecimal } from '../../utils/currency';
import { isMultihash } from '../../utils';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('wallet/spend/');
  }

  defaults() {
    return {
      feeLevel: 'NORMAL',
      memo: '',
    };
  }

  get feeLevels() {
    return [
      'PRIORITY',
      'NORMAL',
      'ECONOMIC',
    ];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.address) {
      addError('address', app.polyglot.t('spendModelErrors.provideAddress'));
    } else if (!isMultihash(attrs.address)) {
      addError('address', app.polyglot.t('spendModelErrors.invalidAddress'));
    }

    if (typeof attrs.amount !== 'number') {
      addError('amount', app.polyglot.t('spendModelErrors.provideAmountNumber'));
    } else if (attrs.amount <= 0) {
      addError('amount', app.polyglot.t('spendModelErrors.amountGreaterThanZero'));
    }

    if (this.feeLevels.indexOf(attrs.feeLevel) === -1) {
      addError('feeLevel', `The fee level must be one of [${this.feeLevels}].`);
    }

    if (attrs.memo && typeof attrs.memo !== 'string') {
      addError('memo', 'If provided, the memo should be a string.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
