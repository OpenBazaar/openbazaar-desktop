import { getCurrencyByCode as getWalletCurByCode } from '../../data/walletCurrencies';
import BaseModel from '../BaseModel';

function checkSynced(model) {
  if (!model) {
    throw new Error('Please provide an Order or Case model.');
  }

  if (model.get('contract') === undefined &&
    model.get('buyerOpened') === undefined) {
    throw new Error('The model must be synced to perform this operation.');
  }
}

export default class extends BaseModel {
  get isCase() {
    checkSynced(this);
    return typeof this.get('buyerOpened') !== 'undefined';
  }

  /**
   * Returns the contract. If this is a case, it will return the contract of the
   * party that opened the dispute, which is the only contract you're guaranteed
   * to have. If you need the specific contract of either the buyer or seller,
   * grab it directly via model.get('buyerContract') / model.get('vendorContract').
   */
  get contract() {
    let contract = this.get('contract');

    if (this.isCase) {
      contract = this.get('buyerOpened') ?
        this.get('buyerContract') :
        this.get('vendorContract');
    }

    return contract;
  }

  get participantIds() {
    const contractJSON = this.contract.toJSON();

    return {
      buyer: contractJSON.buyerOrder.buyerID.peerID,
      vendor: contractJSON.vendorListings[0].vendorID.peerID,
      moderator: contractJSON.buyerOrder.payment.moderator,
    };
  }

  get buyerId() {
    return this.participantIds.buyer;
  }

  get vendorId() {
    return this.participantIds.vendor;
  }

  get moderatorId() {
    return this.participantIds.moderator;
  }

  get canBuyerComplete() {
    const orderState = this.get('state');

    return this.contract.get('vendorOrderFulfillment') &&
      ['FULFILLED', 'RESOLVED', 'PAYMENT_FINALIZED'].includes(orderState);
  }

  // TODO: doees this work on a dispute??
  // TODO: doees this work on a dispute??
  // TODO: doees this work on a dispute??
  get paymentCoin() {
    let paymentCoin;

    try {
      paymentCoin = this.contract.get('buyerOrder').payment.coin;
    } catch (e) {
      // pass
    }

    return paymentCoin;
  }

  get paymentCurData() {
    let curData;

    try {
      curData = getWalletCurByCode(
        this.contract.get('buyerOrder')
          .payment.coin
      );
    } catch (e) {
      // pass
    }

    return curData;
  }
}
