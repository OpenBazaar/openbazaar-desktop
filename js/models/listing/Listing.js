import app from '../../app';
import BaseModel from '../BaseModel';
import ListingInner from './ListingInner';
import { decimalToInteger, integerToDecimal } from '../../utils/currency';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.guid = options.guid;
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  get nested() {
    return {
      listing: ListingInner,
    };
  }

  validate() {
    const errObj = this.mergeInNestedModelErrors({});

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    if (method === 'read') {
      if (!this.guid) {
        throw new Error('In order to fetch a listing, a guid must be set on the model instance.');
      }

      const slug = this.get('listing').get('slug');

      if (!slug) {
        throw new Error('In order to fetch a listing, a slug must be set as a model attribute' +
          ' on the nested listing model.');
      }

      options.url = options.url ||
        app.getServerUrl(`ipns/${this.guid}/listings/${slug}/listing.json`);
    } else {
      options.url = options.url || app.getServerUrl('ob/listing/');
      options.attrs = options.attrs || this.toJSON();

      // convert price fields
      // todo: give same treatment to all other nested prices (e.g. shipping)
      // once we implement those sections of the modal.
      if (options.attrs.listing.item) {
        const price = options.attrs.listing.item.price;

        if (price) {
          options.attrs.listing.item.price = decimalToInteger(price,
            options.attrs.listing.metadata.pricingCurrency === 'BTC');
        }
      }

      if (this.lastSyncedAttrs.listing && this.lastSyncedAttrs.listing.slug) {
        options.type = 'PUT';
        options.attrs.currentSlug = this.lastSyncedAttrs.listing.slug;
      }
    }

    return super.sync(method, model, options);
  }

  parse(response) {
    let parsedResponse = {};

    if (response.vendorListings && response.vendorListings.length) {
      parsedResponse = {
        listing: response.vendorListings[0],
      };

      // convert price fields
      // todo: give same treatment to all other nested prices (e.g. shipping)
      // once we implement those sections of the modal.
      if (parsedResponse.listing && parsedResponse.listing.item) {
        const price = parsedResponse.listing.item.price;
        const isBtc = parsedResponse.listing.metadata &&
          parsedResponse.listing.metadata.pricingCurrency === 'BTC';

        if (price) {
          parsedResponse.listing.item.price = integerToDecimal(price, isBtc);
        }
      }

      // todo: acceptedCurrency (which is a field we don't use now, but might
      // if we implement cryptocurrency) is comming in with a lower-cased
      // currency code. Capitalize it.
    }

    return parsedResponse;
  }
}
