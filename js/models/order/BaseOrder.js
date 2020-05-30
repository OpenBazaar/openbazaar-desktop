import bigNumber from 'bignumber.js';
import { getCurrencyByCode as getWalletCurByCode } from '../../data/walletCurrencies';
import {
  curDefToDecimal,
  integerToDecimal,
} from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  // Many methods below are exposed both as static and instance getters, with the
  // latter being a proxy to the former. The reason for them being exposed as static
  // is because the instance variety requires all necessary data to be on the model
  // and there are cases where that won't be the case (e.g. in parse), yet the data
  // is available to be passed in. The instance getters are there as a convenience
  // (slightly less syntax to call) and in most cases the model will be synced, so they
  // are the option that is used.

  // PLEASE NOTE: The majority of the functions below will only return an
  // accurate value if the attribute set of the model is passed in after
  // it was obtained from the server. In other words, if only partial data
  // where provided, it may lead to inaccurate results (or exceptions).

  static isCase(attrs = {}) {
    return typeof attrs.buyerOpened !== 'undefined';
  }

  get isCase() {
    return this.constructor.isCase(this.toJSON());
  }

  /**
   * Returns the contract. If this is a case, it will return the contract of the
   * party that opened the dispute, which is the only contract you're guaranteed
   * to have. If you need the specific contract of either the buyer or seller,
   * grab it directly via model.get('buyerContract') / model.get('vendorContract').
   */
  static getContract(attrs = {}) {
    let contract = attrs.contract;

    if (this.isCase(attrs)) {
      contract = attrs.buyerOpened ?
        attrs.buyerContract :
        attrs.vendorContract;
    }

    return contract;
  }

  get contract() {
    let contract = this.get('contract');

    if (this.isCase) {
      contract = this.get('buyerOpened') ?
        this.get('buyerContract') :
        this.get('vendorContract');
    }

    return contract;
  }

  static getParticipantIds(attrs = {}) {
    return {
      buyer: this.getContract(attrs).buyerOrder.buyerID.peerID,
      vendor: this.getContract(attrs).vendorListings[0].vendorID.peerID,
      moderator: this.getContract(attrs).buyerOrder.payment.moderator,
    };
  }

  get participantIds() {
    return this.constructor.getParticipantIds(this.toJSON());
  }

  static getBuyerId(attrs = {}) {
    return this.getParticipantIds(attrs).buyer;
  }

  get buyerId() {
    return this.constructor.getBuyerId(this.toJSON());
  }

  static getVendorId(attrs = {}) {
    return this.getParticipantIds(attrs).vendor;
  }

  get vendorId() {
    return this.constructor.getVendorId(this.toJSON());
  }

  static getModeratorId(attrs = {}) {
    return this.getParticipantIds(attrs).moderator;
  }

  get moderatorId() {
    return this.constructor.getModeratorId(this.toJSON());
  }

  static canBuyerComplete(attrs = {}) {
    const orderState = attrs.state;

    return this.getContract(attrs).vendorOrderFulfillment &&
      ['FULFILLED', 'RESOLVED', 'PAYMENT_FINALIZED'].includes(orderState);
  }

  get canBuyerComplete() {
    return this.constructor.canBuyerComplete(this.toJSON());
  }

  static getPaymentCoin(attrs = {}) {
    let paymentCoin = '';

    try {
      paymentCoin =
        this.getContract(attrs)
          .buyerOrder
          .payment
          .amountCurrency
          .code;
    } catch (e) {
      // pass
    }

    return paymentCoin;
  }


  get paymentCoin() {
    return this.constructor.getPaymentCoin(this.toJSON());
  }

  static getPaymentCoinData(attrs = {}) {
    let curData;

    try {
      curData = getWalletCurByCode(this.getPaymentCoin(attrs));
    } catch (e) {
      // pass
    }

    return curData;
  }

  get paymentCoinData() {
    return this.constructor.getPaymentCoinData(this.toJSON());
  }

  static parseContract(contract) {
    if (contract) {
      let payment;

      try {
        payment = contract.buyerOrder.payment;
      } catch (e) {
        // pass
      }

      if (payment) {
        payment.bigAmount = curDefToDecimal({
          amount: payment.bigAmount,
          currency: payment.amountCurrency,
        });
      }

      // convert crypto listing quantities
      contract.buyerOrder.items.forEach((item, index) => {
        try {
          const listing = contract.vendorListings[index];

          if (listing.metadata.contractType === 'CRYPTOCURRENCY') {
            const divisibility = listing
              .metadata
              .coinDivisibility;

            item.quantity = integerToDecimal(item.quantity, divisibility);
          }
        } catch (e) {
          item.quantity = bigNumber();
        }
      });
    }

    return contract;
  }

  static parseDisputePayout(resolution) {
    let divisibility;

    try {
      divisibility =
        resolution
          .payout
          .payoutCurrency
          .divisibility;
    } catch (e) {
      // pass
    }

    if (resolution && resolution.payout) {
      if (resolution.payout.buyerOutput) {
        // legacy check
        if (resolution.payout.buyerOutput.bigAmount === '') {
          resolution.payout.buyerOutput.bigAmount = integerToDecimal(
            resolution.payout.buyerOutput.amount,
            8
          );
        } else {
          resolution.payout.buyerOutput.bigAmount =
            integerToDecimal(
              resolution.payout.buyerOutput.bigAmount,
              divisibility,
              { fieldName: 'buyerOutput.bigAmount' }
            );
        }
      }

      if (resolution.payout.vendorOutput) {
        // legacy check
        if (resolution.payout.vendorOutput.bigAmount === '') {
          resolution.payout.vendorOutput.bigAmount = integerToDecimal(
            resolution.payout.vendorOutput.amount,
            8
          );
        } else {
          resolution.payout.vendorOutput.bigAmount =
            integerToDecimal(
              resolution.payout.vendorOutput.bigAmount,
              divisibility,
              { fieldName: 'vendorOutput.bigAmount' }
            );
        }
      }

      if (resolution.payout.moderatorOutput) {
        if (resolution.payout.moderatorOutput) {
          // legacy check
          if (resolution.payout.moderatorOutput.bigAmount === '') {
            resolution.payout.moderatorOutput.bigAmount = integerToDecimal(
              resolution.payout.moderatorOutput.amount,
              8
            );
          } else {
            resolution.payout.moderatorOutput.bigAmount =
              integerToDecimal(
                resolution.payout.moderatorOutput.bigAmount,
                divisibility,
                { fieldName: 'moderatorOutput.bigAmount' }
              );
          }
        }
      }
    }

    return resolution;
  }
}
