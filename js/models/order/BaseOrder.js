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

  get participantIds() {
    let contract = this.get('contract');

    if (this.isCase) {
      contract = this.get('buyerOpened') ?
        this.get('buyerContract') :
        this.get('vendorContract');
    }

    const contractJSON = contract.toJSON();

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
}
