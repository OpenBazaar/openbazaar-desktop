import BaseModel from '../../BaseModel';
import PhysicalDelivery from './PhysicalDelivery';
import DigitalDelivery from './DigitalDelivery';

export default class extends BaseModel {
  constructor(attrs  = {}, options) {
    if (!options.contractType) {
      throw new Error('Please provide the contract type.');
    }

    if (options.contractType === 'DIGITAL_GOOD') {
      attrs.digitalDelivery = new DigitalDelivery();
    } else if (options.contractType === 'PHYSICAL_GOOD') {
      attrs.physicalDelivery = new PhysicalDelivery();
    }

    super(attrs, options);
    this.contractType = options.contractType;
  }

  get idAttribute() {
    return 'orderId';
  }

  get nested() {
    return {
      physicalDelivery: PhysicalDelivery,
      digitalDelivery: DigitalDelivery,
    };
  }

  // validate(attrs) {
  //   const errObj = {};
  //   const addError = (fieldName, error) => {
  //     errObj[fieldName] = errObj[fieldName] || [];
  //     errObj[fieldName].push(error);
  //   };

  //   if (!attrs.shipper || (typeof attrs.shipper === 'string' && !attrs.shipper.trim())) {
  //     addError('shipper', app.polyglot.t('orderFulfillmentModelErrors.provideShipper'));
  //   }

  //   if (Object.keys(errObj).length) return errObj;

  //   return undefined;
  // }  
}
