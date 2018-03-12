import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    if (typeof options.buyerContractArrived !== 'function') {
      throw new Error('Please provide a function that returns a boolean indicating ' +
        'whether the buyer\'s contract is available.');
    }

    if (typeof options.vendorContractArrived !== 'function') {
      throw new Error('Please provide a function that returns a boolean indicating ' +
        'whether the vendor\'s contract is available.');
    }

    if (typeof options.vendorProcessingError !== 'function') {
      throw new Error('Please provide a function that returns a boolean indicating ' +
        'whether the vendor had an error processing the order.');
    }

    super(attrs, options);
    this.buyerContractArrived = options.buyerContractArrived;
    this.vendorContractArrived = options.vendorContractArrived;
    this.vendorProcessingError = options.vendorProcessingError;
  }

  defaults() {
    return {
      resolution: '',
    };
  }

  url() {
    return app.getServerUrl('ob/closedispute/');
  }

  get idAttribute() {
    return 'orderId';
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    let vendorPercentageOk = false;
    let buyerPercentageOk = false;

    if (this.vendorContractArrived() && !this.vendorProcessingError()) {
      if (typeof attrs.vendorPercentage === 'undefined' || attrs.vendorPercentage === '') {
        addError('vendorPercentage',
          app.polyglot.t('resolveDisputeModelErrors.provideAmount'));
      } else if (typeof attrs.vendorPercentage !== 'number') {
        addError('vendorPercentage',
          app.polyglot.t('resolveDisputeModelErrors.providePercentageAsNumber'));
      } else if (attrs.vendorPercentage < 0 || attrs.vendorPercentage > 100) {
        addError('vendorPercentage',
          app.polyglot.t('resolveDisputeModelErrors.percentageOutOfRange'));
      } else if (!this.buyerContractArrived() && attrs.vendorPercentage !== 100) {
        addError('vendorPercentage',
          app.polyglot.t('resolveDisputeModelErrors.vendorPercentageMustBe100'));
      } else {
        vendorPercentageOk = true;
      }
    } else {
      if (attrs.vendorPercentage !== 0) {
        addError('vendorPercentage',
          'The vendor amount must be zero if their contract is not available.');
      }
    }

    if (this.buyerContractArrived()) {
      if (typeof attrs.buyerPercentage === 'undefined' || attrs.buyerPercentage === '') {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.provideAmount'));
      } else if (typeof attrs.buyerPercentage !== 'number') {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.providePercentageAsNumber'));
      } else if (attrs.buyerPercentage < 0 || attrs.buyerPercentage > 100) {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.percentageOutOfRange'));
      } else if (!this.vendorContractArrived() && attrs.buyerPercentage !== 100) {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.buyerPercentageMustBe100'));
      } else {
        buyerPercentageOk = true;
      }
    } else {
      if (attrs.buyerPercentage !== 0) {
        addError('buyerPercentage',
          'The buyer amount must be zero if their contract is not available.');
      }
    }

    if (vendorPercentageOk && buyerPercentageOk) {
      if (attrs.buyerPercentage + attrs.vendorPercentage > 100) {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.totalPercentageOutOfRange'));
      } else if (attrs.buyerPercentage + attrs.vendorPercentage < 100) {
        addError('buyerPercentage',
          app.polyglot.t('resolveDisputeModelErrors.totalPercentageTooLow'));
      }
    }

    if (!attrs.resolution) {
      addError('resolution',
        app.polyglot.t('resolveDisputeModelErrors.provideResolution'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    if (method === 'create' || method === 'update') {
      options.type = 'POST';
    }

    return super.sync(method, model, options);
  }
}
