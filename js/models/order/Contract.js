import app from '../../app';
import moment from 'moment';
import BaseModel from '../BaseModel';
import Listings from '../../collections/order/Listings';

/*
 * This differs from escrowTimeoutHours. escrowTimeoutHours is obtained from
 * the contract is the amount of time that parties have to open a dispute. It is
 * also the value used for the time-lock in the blockchain transaction.
 *
 * disputeExpiry, on the other hand, is how long a mod has to make a decision
 * once the dispute is opened. It is maintained as a constant on the server which
 * we are mirroring here.
 */
export function getDisputeExpiry() {
  return app.serverConfig.testnet ? 1 : 24 * 45;
}

export default class extends BaseModel {
  get nested() {
    return {
      vendorListings: Listings,
    };
  }

  get type() {
    return this.get('vendorListings')
      .at(0)
      .get('metadata')
      .get('contractType');
  }

  get isLocalPickup() {
    const buyerOrder = this.get('buyerOrder');

    if (buyerOrder && buyerOrder.items && buyerOrder.items[0] &&
      buyerOrder.items[0].shippingOption) {
      return buyerOrder.items[0].shippingOption.service === '';
    }

    return false;
  }

  /**
   * Returns the provided seconds in a verbose localized form based on how much time
   * has elapsed from the provided seconds until now, for example
   * '25 days' or '2 hours'.
   */
  timeFromNowVerbose(secs) {
    const prevMomentDaysThreshold = moment.relativeTimeThreshold('d');

    // temporarily upping the moment threshold of number of days before month is used,
    // so in the escrow timeouts 45 is represented as '45 days' instead of '1 month'.
    moment.relativeTimeThreshold('d', 364);

    const str = moment(Date.now())
      .from(
        moment(Date.now() + (secs * 60 * 60 * 1000)), true
      );

    // restore the days timeout threshold
    moment.relativeTimeThreshold('d', prevMomentDaysThreshold);

    return str;
  }

  /**
   * Returns the escrowTimeoutHours field. It will throw an exception if the field
   * is not avaialable or invalid.
   */
  get escrowTimeoutHours() {
    let escrowTimeoutHours = this.get('vendorListings')
      .at(0)
      .get('metadata')
      .get('escrowTimeoutHours');

    escrowTimeoutHours = parseInt(escrowTimeoutHours, 10);

    if (!escrowTimeoutHours || escrowTimeoutHours < 0) {
      throw new Error(
        'The escrowTimeoutHours is in an invalid format. It must be a positive integer.'
      );
    }

    return escrowTimeoutHours;
  }

  get escrowTimeoutHoursVerbose() {
    return this.timeFromNowVerbose(this.escrowTimeoutHours);
  }

  get disputeExpiry() {
    return getDisputeExpiry();
  }

  get disputeExpiryVerbose() {
    return this.timeFromNowVerbose(this.disputeExpiry);
  }

  parse(response) {
    return {
      ...response,
      // The parse of the Listing model is expecting the listings to be objects
      // with a key of 'listing' (e.g. listing: { slug: '', ... }, so we'll accomodate.
      vendorListings: response.vendorListings.map(listing => ({ listing })),
    };
  }
}
