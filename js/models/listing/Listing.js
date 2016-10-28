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
    const errObj = this.mergeInNestedErrors({});

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    let returnSync = 'will-set-later';

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
        app.getServerUrl(`ipns/${this.guid}/listings/${slug}.json`);
    } else {
      options.url = options.url || app.getServerUrl('ob/listing/');
      options.attrs = options.attrs || this.toJSON();

      // convert price fields
      if (options.attrs.listing.item.price) {
        const price = options.attrs.listing.item.price;
        options.attrs.listing.item.price = decimalToInteger(price,
          options.attrs.listing.metadata.pricingCurrency === 'BTC');
      }

      options.attrs.listing.shippingOptions.forEach(shipOpt => {
        shipOpt.services.forEach(service => {
          if (typeof service.price === 'number') {
            service.price = decimalToInteger(service.price,
              options.attrs.listing.metadata.pricingCurrency === 'BTC');
          }
        });
      });

      if (options.attrs.listing.slug) {
        // it's an update
        options.type = 'PUT';
      }
    }

    returnSync = super.sync(method, model, options);

    if (method === 'create') {
      // On a successful create the slug will be returned. Here we'll move
      // it so it's stored correcly on the nested listing model.
      returnSync.done((data) => {
        if (data && data.slug) {
          this.unset('slug');
          this.get('listing').set('slug', data.slug);
        }
      });
    }

    return returnSync;
  }

  parse(response) {
    let parsedResponse = {};

    if (response.vendorListings && response.vendorListings.length) {
      parsedResponse = {
        listing: response.vendorListings[0],
      };

      // convert price fields
      if (parsedResponse.listing && parsedResponse.listing.item) {
        const price = parsedResponse.listing.item.price;
        const isBtc = parsedResponse.listing.metadata &&
          parsedResponse.listing.metadata.pricingCurrency === 'BTC';

        if (price) {
          parsedResponse.listing.item.price = integerToDecimal(price, isBtc);
        }
      }

      if (parsedResponse.listing && parsedResponse.listing.shippingOptions
        && parsedResponse.listing.shippingOptions.length) {
        parsedResponse.listing.shippingOptions.forEach((shipOpt, shipOptIndex) => {
          if (shipOpt.services && shipOpt.services.length) {
            shipOpt.services.forEach((service, serviceIndex) => {
              const price = service.price;
              const isBtc = parsedResponse.listing.metadata &&
                parsedResponse.listing.metadata.pricingCurrency === 'BTC';

              if (typeof price === 'number') {
                parsedResponse.listing.shippingOptions[shipOptIndex]
                  .services[serviceIndex].price = integerToDecimal(price, isBtc);
              } else {
                // This is necessary because of this bug:
                // https://github.com/OpenBazaar/openbazaar-go/issues/178
                parsedResponse.listing.shippingOptions[shipOptIndex]
                  .services[serviceIndex].price = 0;
              }
            });
          }
        });
      }

      // todo: acceptedCurrency (which is a field we don't use now, but might
      // if we implement cryptocurrency) is comming in with a lower-cased
      // currency code. Capitalize it.
    }

    return parsedResponse;
  }
}
