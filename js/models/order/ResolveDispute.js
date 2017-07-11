import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
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

    if (typeof attrs.vendorPercentage === 'undefined' || attrs.vendorPercentage === '') {
      addError('vendorPercentage',
        app.polyglot.t('resolveDisputeModelErrors.provideAmount'));
    } else if (typeof attrs.vendorPercentage !== 'number') {
      addError('vendorPercentage',
        app.polyglot.t('resolveDisputeModelErrors.providePercentageAsNumber'));
    } else if (attrs.vendorPercentage < 0 || attrs.vendorPercentage > 100) {
      addError('vendorPercentage',
        app.polyglot.t('resolveDisputeModelErrors.vendorPercentageOutOfRange'));
    } else {
      vendorPercentageOk = true;
    }

    if (typeof attrs.buyerPercentage === 'undefined' || attrs.buyerPercentage === '') {
      addError('buyerPercentage',
        app.polyglot.t('resolveDisputeModelErrors.provideAmount'));
    } else if (typeof attrs.buyerPercentage !== 'number') {
      addError('buyerPercentage',
        app.polyglot.t('resolveDisputeModelErrors.providePercentageAsNumber'));
    } else if (attrs.buyerPercentage < 0 || attrs.buyerPercentage > 100) {
      addError('buyerPercentage',
        app.polyglot.t('resolveDisputeModelErrors.buyerPercentageOutOfRange'));
    } else {
      buyerPercentageOk = true;
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
