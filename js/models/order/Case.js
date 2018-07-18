import { integerToDecimal } from '../../utils/currency';
import BaseOrder from './BaseOrder';
import Contract from './Contract';
import app from '../../app';

export default class extends BaseOrder {
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

  /**
   * Returns the contract of the party that opened the dispute, which is the only
   * contract you're guaranteed to have. If you need the specific contract of either
   * the buyer or seller, grab it directly via model.get('buyerContract') /
   * model.get('vendorContract').
   */
  get contract() {
    return this.get('buyerOpened') ?
      this.get('buyerContract') : this.get('vendorContract');
  }

  /**
   * Returns a boolean indicating whether the vendor had an error when processing
   * the order. Since this relies on data from the buyers contract, if the contract is
   * not verified as authentic, false will be returned even if the data suggests
   * otherwise. We don't want to prevent funds from being awared to the vendor based
   * on potentially forged data from the buyer's contract.
   */
  get vendorProcessingError() {
    const contract = this.get('buyerContract');
    const contractErrors = this.get('buyerContractValidationErrors');
    return !!contract &&
      Array.isArray(contract.get('errors')) &&
      (
        !contractErrors ||
        !(Array.isArray(contractErrors) && contractErrors.length)
      );
  }

  /**
   * - If the contract hasn't arrived, using this logic, it will be considered invalid.
   * - If the vendor had an error processing the order and the buyer's contract is verified
   *   as authentic, the vendor's contract will be considered valid even though it will not
   *   be sent over, since the mod will only be allowed to send the funds to the buyer.
   */
  isContractValid(buyer = true) {
    const hasContractArrived = buyer ?
      !!this.get('buyerContract') :
      !!this.get('vendorContract');
    const errors = buyer ?
      this.get('buyerContractValidationErrors') :
      this.get('vendorContractValidationErrors');

    return hasContractArrived &&
      (!errors ||
        (Array.isArray(errors) && !errors.length)) ||
      !buyer && this.vendorProcessingError;
  }

  get isBuyerContractValid() {
    return this.isContractValid();
  }

  get isVendorContractValid() {
    return this.isContractValid(false);
  }

  get bothContractsValid() {
    return this.isBuyerContractValid && this.isVendorContractValid;
  }

  get isOrderCancelable() {
    return false;
  }

  get isOrderDisputable() {
    return false;
  }

  convertCryptoQuantity(contract = {}) {
    contract.buyerOrder.items.forEach((item, index) => {
      const listing = contract.vendorListings[index];

      if (listing.metadata.contractType === 'CRYPTOCURRENCY') {
        const coinDivisibility = listing.metadata
          .coinDivisibility;

        item.quantity = item.quantity / coinDivisibility;
      }
    });

    return contract;
  }

  parse(response = {}) {
    // If only one contract has arrived, we'll fire an event when the other one comes
    if (!this._otherContractEventBound &&
      !this.vendorProcessingError &&
      (
        (response.buyerOpened && !response.vendorContract) ||
        (!response.buyerOpened && !response.buyerContract)
      )
    ) {
      const needBuyer = !response.buyerContract;
      this._otherContractEventBound = true;
      this.once(`change:${needBuyer ? 'buyer' : 'vendor'}Contract`,
        () => this.trigger('otherContractArrived', this, { isBuyer: needBuyer }));
    }

    if (response.buyerContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawBuyerContract =
        JSON.parse(JSON.stringify(response.buyerContract)); // deep clone

      // convert price fields
      response.buyerContract.buyerOrder.payment.amount =
        integerToDecimal(response.buyerContract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);

      response.buyerContract = this.convertCryptoQuantity(response.buyerContract);
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
    }

    if (response.resolution) {
      response.resolution.payout.buyerOutput =
        response.resolution.payout.buyerOutput || {};
      response.resolution.payout.vendorOutput =
        response.resolution.payout.vendorOutput || {};
      response.resolution.payout.moderatorOutput =
        response.resolution.payout.moderatorOutput || {};

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

    return response;
  }
}
