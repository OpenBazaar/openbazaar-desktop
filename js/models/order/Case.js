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

  // FYI: If the contract hasn't arrived, using this logic, it will be considered invalid.
  isContractValid(buyer = true) {
    const errors = buyer ?
      this.get('buyerContractValidationErrors') :
      this.get('vendorContractValidationErrors');

    return !errors ||
      (Array.isArray(errors) && !errors.length);
  }

  get isBuyerContractValid() {
    return this.isContractValid();
  }

  get isVendorContractValid() {
    return this.isContractValid(false);
  }

  parse(response = {}) {
    if (response.buyerContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawBuyerContract =
        JSON.parse(JSON.stringify(response.buyerContract)); // deep clone

      // convert price fields
      response.buyerContract.buyerOrder.payment.amount =
        integerToDecimal(response.buyerContract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);
    }

    if (response.vendorContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawVendorContract =
        JSON.parse(JSON.stringify(response.vendorContract)); // deep clone

      // convert price fields
      response.vendorContract.buyerOrder.payment.amount =
        integerToDecimal(response.vendorContract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);

      if (response.resolution) {
        response.resolution.payout.buyerOutput =
          response.resolution.payout.buyerOutput || {};
        response.resolution.payout.vendorOutput =
          response.resolution.payout.vendorOutput || {};
        response.resolution.payout.moderatorOutput =
          response.resolution.payout.moderatorOutput || {};

        // Temporary to account for server bug:
        // https://github.com/OpenBazaar/openbazaar-go/issues/548
        // Sometimes the payment amounts are coming back as enormously inflated strings.
        // For now, we'll just make them dummy values.
        if (typeof response.resolution.payout.buyerOutput.amount === 'string') {
          response.resolution.payout.buyerOutput.amount = 25000;
        }

        if (typeof response.resolution.payout.vendorOutput.amount === 'string') {
          response.resolution.payout.vendorOutput.amount = 12000;
        }

        if (typeof response.resolution.payout.moderatorOutput.amount === 'string') {
          response.resolution.payout.moderatorOutput.amount = 6000;
        }

        response.resolution.payout.buyerOutput.amount =
          integerToDecimal(response.resolution.payout.buyerOutput.amount || 0,
            app.serverConfig.cryptoCurrency);
        response.resolution.payout.vendorOutput.amount =
          integerToDecimal(response.resolution.payout.vendorOutput.amount || 0,
            app.serverConfig.cryptoCurrency);
        response.resolution.payout.moderatorOutput.amount =
          integerToDecimal(response.resolution.payout.moderatorOutput.amount || 0,
            app.serverConfig.cryptoCurrency);
      }
    }

    return response;
  }
}
