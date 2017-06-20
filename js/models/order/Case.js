import { integerToDecimal } from '../../utils/currency';
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

      // convert price fields
      response.buyerContract.buyerOrder.payment.amount =
        integerToDecimal(response.buyerContract.buyerOrder.payment.amount, true);
    }

    if (response.vendorContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawVendorContract =
        JSON.parse(JSON.stringify(response.vendorContract)); // deep clone

      // convert price fields
      response.vendorContract.buyerOrder.payment.amount =
        integerToDecimal(response.vendorContract.buyerOrder.payment.amount, true);

      // if (response.resolution) {
      //   response.resolution.payout.buyerOutput.amount =
      //     integerToDecimal(response.resolution.payout.buyerOutput.amount, true);
      //   response.resolution.buyerOutput.amount =
      //     integerToDecimal(response.resolution.payout.vendorOutput.amount, true);
      //   response.resolution.buyerOutput.amount =
      //     integerToDecimal(response.resolution.payout.moderatorOutput.amount, true);
      // }
    }

    return response;
  }
}
