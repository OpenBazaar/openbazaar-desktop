import BaseModel from '../BaseModel';
import Contract from './Contract';
import app from '../../app';

export default class extends BaseModel {
  url() {
    return app.getServerUrl(`ob/case/${this.id}`);
  }

  get idAttribute() {
    return 'caseId';
  }

  get nested() {
    return {
      vendorContract: Contract,
      buyerContract: Contract,
    };
  }

  parse(response = {}) {
    if (response.buyerContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawBuyerContract =
        JSON.parse(JSON.stringify(response.buyerContract)); // deep clone
    }

    if (response.vendorContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawVendorContract =
        JSON.parse(JSON.stringify(response.vendorContract)); // deep clone
    }

    return response;
  }
}
