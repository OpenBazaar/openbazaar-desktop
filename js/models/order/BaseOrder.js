import { getCurrencyByCode as getWalletCurByCode } from '../../data/walletCurrencies';
import BaseModel from '../BaseModel';

// PLEASE NOTE: The majority of the functions below will only return an
// accurate value if the attribute set of the model is passed after the model
// was synced from the server.

function isCase(attrs = {}) {
  return typeof attrs.buyerOpened !== 'undefined';
}

/**
 * Returns the contract. If this is a case, it will return the contract of the
 * party that opened the dispute, which is the only contract you're guaranteed
 * to have. If you need the specific contract of either the buyer or seller,
 * grab it directly via model.get('buyerContract') / model.get('vendorContract').
 */
function getContract(attrs = {}) {
  let contract = attrs.contract;

  if (isCase(attrs)) {
    contract = attrs.buyerOpened ?
      attrs.buyerContract :
      attrs.vendorContract;
  }

  return contract;
}

function getParticipantIds(attrs = {}) {
  return {
    buyer: getContract(attrs).buyerOrder.buyerID.peerID,
    vendor: getContract(attrs).vendorListings[0].vendorID.peerID,
    moderator: getContract(attrs).buyerOrder.payment.moderator,
  };
}

function getBuyerId(attrs = {}) {
  return getParticipantIds(attrs).buyer;
}

function getVendorId(attrs = {}) {
  return getParticipantIds(attrs).vendor;
}

function getModeratorId(attrs = {}) {
  return getParticipantIds(attrs).moderator;
}

function canBuyerComplete(attrs = {}) {
  const orderState = attrs.state;

  return getContract(attrs).vendorOrderFulfillment &&
    ['FULFILLED', 'RESOLVED', 'PAYMENT_FINALIZED'].includes(orderState);
}

export function getPaymentCoin(attrs = {}) {
  let paymentCoin;

  try {
    paymentCoin = getContract(attrs).buyerOrder.payment.coin;
  } catch (e) {
    // pass
  }

  return paymentCoin;
}

function getPaymentCurData(attrs = {}) {
  let curData;

  try {
    curData = getWalletCurByCode(
      getContract(attrs).buyerOrder
        .payment.coin
    );
  } catch (e) {
    // pass
  }

  return curData;
}

export default class extends BaseModel {
  get isCase() {
    return isCase(this.toJSON());
  }

  get contract() {
    return getContract(this.toJSON());
  }

  get participantIds() {
    return getParticipantIds(this.toJSON());
  }

  get buyerId() {
    return getBuyerId(this.toJSON());
  }

  get vendorId() {
    return getVendorId(this.toJSON());
  }

  get moderatorId() {
    return getModeratorId(this.toJSON());
  }

  get canBuyerComplete() {
    return canBuyerComplete(this.toJSON());
  }

  get paymentCoin() {
    return getPaymentCoin(this.toJSON());
  }

  get paymentCurData() {
    return getPaymentCurData(this.toJSON());
  }
}
