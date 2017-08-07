import _ from 'underscore';
import is from 'is_js';
import app from '../../app';
import { getIndexedCountries } from '../../data/countries';
import { events as listingEvents, shipsFreeToMe } from './';
import { decimalToInteger, integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';
import Item from './Item';
import Metadata from './Metadata';
import ShippingOptions from '../../collections/listing/ShippingOptions.js';
import Coupons from '../../collections/listing/Coupons.js';

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

  defaults() {
    return {
      termsAndConditions: '',
      refundPolicy: '',
      item: new Item(),
      metadata: new Metadata(),
      shippingOptions: new ShippingOptions(),
      coupons: new Coupons(),
    };
  }

  isNew() {
    return !this.get('slug');
  }

  get nested() {
    return {
      item: Item,
      metadata: Metadata,
      shippingOptions: ShippingOptions,
      coupons: Coupons,
    };
  }

  get shipsFreeToMe() {
    return shipsFreeToMe(this);
  }

  get max() {
    return {
      refundPolicyLength: 10000,
      termsAndConditionsLength: 10000,
      couponCount: 30,
    };
  }

  get isOwnListing() {
    if (this.guid === undefined) {
      throw new Error('Unable to determine ownListing ' +
        'because a guid has not been set on this model.');
    }

    return app.profile.id === this.guid;
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.refundPolicy) {
      if (is.not.string(attrs.refundPolicy)) {
        addError('refundPolicy', 'The return policy must be of type string.');
      } else if (attrs.refundPolicy.length > this.max.refundPolicyLength) {
        addError('refundPolicy', app.polyglot.t('listingModelErrors.returnPolicyTooLong'));
      }
    }

    if (attrs.termsAndConditions) {
      if (is.not.string(attrs.termsAndConditions)) {
        addError('termsAndConditions', 'The terms and conditions must be of type string.');
      } else if (attrs.termsAndConditions.length > this.max.termsAndConditionsLength) {
        addError('termsAndConditions',
          app.polyglot.t('listingModelErrors.termsAndConditionsTooLong'));
      }
    }

    if (this.get('metadata').get('contractType') === 'PHYSICAL_GOOD' &&
      !attrs.shippingOptions.length) {
      addError('shippingOptions', app.polyglot.t('listingModelErrors.provideShippingOption'));
    }

    if (attrs.coupons.length > this.max.couponCount) {
      addError('coupons', app.polyglot.t('listingModelErrors.tooManyCoupons',
        { maxCouponCount: this.max.couponCount }));
    }

    errObj = this.mergeInNestedErrors(errObj);

    // Coupon price discount cannot exceed the item price.
    attrs.coupons.forEach(coupon => {
      const priceDiscount = coupon.get('priceDiscount');

      if (typeof priceDiscount !== 'undefined' && priceDiscount >= attrs.item.get('price')) {
        addError(`coupons[${coupon.cid}].priceDiscount`,
          app.polyglot.t('listingModelErrors.couponsPriceTooLarge'));
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    let returnSync = 'will-set-later';

    if (method === 'read') {
      if (!this.guid) {
        throw new Error('In order to fetch a listing, a guid must be set on the model instance.');
      }

      const slug = this.get('slug');

      if (!slug) {
        throw new Error('In order to fetch a listing, a slug must be set as a model attribute.');
      }

      if (this.isOwnListing) {
        options.url = options.url ||
          app.getServerUrl(`ob/listing/${slug}`);
      } else {
        options.url = options.url ||
          app.getServerUrl(`ob/listing/${this.guid}/${slug}`);
      }
    } else {
      if (method !== 'delete') {
        options.url = options.url || app.getServerUrl('ob/listing/');
        // it's a create or update
        options.attrs = options.attrs || this.toJSON();

        // convert price fields
        if (options.attrs.item.price) {
          const price = options.attrs.item.price;
          options.attrs.item.price = decimalToInteger(price,
            options.attrs.metadata.pricingCurrency === 'BTC');
        }

        options.attrs.shippingOptions.forEach(shipOpt => {
          shipOpt.services.forEach(service => {
            if (typeof service.price === 'number') {
              service.price = decimalToInteger(service.price,
                options.attrs.metadata.pricingCurrency === 'BTC');
            }
          });
        });

        options.attrs.coupons.forEach(coupon => {
          if (typeof coupon.priceDiscount === 'number') {
            coupon.priceDiscount = decimalToInteger(coupon.priceDiscount,
              options.attrs.metadata.pricingCurrency === 'BTC');
          }
        });
        // END - convert price fields

        // If providing a quanitity and / or productID on the Item and not
        // providing any SKUs, then we'll send item.quantity and item.productID
        // in as a "dummy" SKU (as the server expects). If you are providing any
        // SKUs, then item.quantity and item.productID will be ignored.
        if (!options.attrs.item.skus.length) {
          const dummySku = {};

          if (typeof options.attrs.item.quantity === 'number') {
            dummySku.quantity = options.attrs.item.quantity;
          }

          if (typeof options.attrs.item.productID === 'string' &&
            options.attrs.item.productID.length) {
            dummySku.productID = options.attrs.item.productID;
          }

          if (Object.keys(dummySku).length) {
            options.attrs.item.skus = [dummySku];
          }
        } else {
          options.attrs.item.skus.forEach(sku => {
            if (typeof sku.surcharge === 'number') {
              sku.surcharge = decimalToInteger(sku.surcharge,
                options.attrs.metadata.pricingCurrency === 'BTC');
            }
          });
        }

        delete options.attrs.item.productID;
        delete options.attrs.item.quantity;

        // Our Sku has an infinteInventory boolean attribute, but the server
        // is expecting a quantity negative quantity in that case.
        options.attrs.item.skus.forEach(sku => {
          if (sku.infiniteInventory) {
            sku.quantity = -1;
          }

          delete sku.infiniteInventory;
        });

        // remove the hash
        delete options.attrs.hash;

        // If all countries are individually provided as shipping regions, we'll send
        // 'ALL' to the server.
        options.attrs.shippingOptions.forEach(shipOpt => {
          if (_.isEqual(Object.keys(getIndexedCountries()), shipOpt.regions)) {
            shipOpt.regions = ['ALL'];
          }
        });
      } else {
        options.url = options.url ||
          app.getServerUrl(`ob/listing/${this.get('slug')}`);
      }
    }

    returnSync = super.sync(method, model, options);

    const eventOpts = {
      xhr: returnSync,
      url: options.url,
    };

    if (method === 'create' || method === 'update') {
      const attrsBeforeSync = this.lastSyncedAttrs;

      returnSync.done(data => {
        const hasChanged = () => (!_.isEqual(attrsBeforeSync, this.toJSON()));

        if (data.slug) {
          this.set('slug', data.slug);
        }

        listingEvents.trigger('saved', this, {
          ...eventOpts,
          created: method === 'create',
          slug: this.get('slug'),
          hasChanged,
        });
      });
    } else if (method === 'delete') {
      listingEvents.trigger('destroying', this, {
        ...eventOpts,
        slug: this.get('slug'),
      });

      returnSync.done(() => {
        listingEvents.trigger('destroy', this, {
          ...eventOpts,
          slug: this.get('slug'),
        });
      });
    }

    return returnSync;
  }

  parse(response) {
    const parsedResponse = response.listing;

    if (parsedResponse) {
      // set the hash
      parsedResponse.hash = response.hash;

      // convert price fields
      if (parsedResponse.item) {
        const price = parsedResponse.item.price;
        const isBtc = parsedResponse.metadata &&
          parsedResponse.metadata.pricingCurrency === 'BTC';

        if (price) {
          parsedResponse.item.price = integerToDecimal(price, isBtc);
        }
      }

      if (parsedResponse.shippingOptions && parsedResponse.shippingOptions.length) {
        parsedResponse.shippingOptions.forEach((shipOpt, shipOptIndex) => {
          if (shipOpt.services && shipOpt.services.length) {
            shipOpt.services.forEach((service, serviceIndex) => {
              const price = service.price;
              const isBtc = parsedResponse.metadata &&
                parsedResponse.metadata.pricingCurrency === 'BTC';

              if (typeof price === 'number') {
                parsedResponse.shippingOptions[shipOptIndex]
                  .services[serviceIndex].price = integerToDecimal(price, isBtc);
              } else {
                // This is necessary because of this bug:
                // https://github.com/OpenBazaar/openbazaar-go/issues/178
                parsedResponse.shippingOptions[shipOptIndex]
                  .services[serviceIndex].price = 0;
              }
            });
          }

          // If the shipping regions are set to 'ALL', we'll replace with a list of individual
          // countries, which is what our UI is deisgned to work with.
          if (shipOpt.regions && shipOpt.regions.length && shipOpt.regions[0] === 'ALL') {
            parsedResponse.shippingOptions[shipOptIndex].regions =
              Object.keys(getIndexedCountries());
          }
        });
      }

      if (parsedResponse.coupons && parsedResponse.coupons.length) {
        parsedResponse.coupons.forEach((coupon, couponIndex) => {
          if (typeof coupon.priceDiscount === 'number') {
            const price = parsedResponse.coupons[couponIndex].priceDiscount;
            const isBtc = parsedResponse.metadata &&
              parsedResponse.metadata.pricingCurrency === 'BTC';

            parsedResponse.coupons[couponIndex].priceDiscount =
              integerToDecimal(price, isBtc);
          }
        });
      }

      // Re-organize variant structure so a "dummy" SKU (if present) has its quanitity
      // and productID moved to be attributes of the Item model
      if (parsedResponse.item && parsedResponse.item.skus &&
        parsedResponse.item.skus.length === 1 &&
        typeof parsedResponse.item.skus[0].variantCombo === 'undefined') {
        const dummySku = parsedResponse.item.skus[0];
        parsedResponse.item.quantity = dummySku.quantity;
        parsedResponse.item.productID = dummySku.productID;
      }

      if (parsedResponse.item && parsedResponse.item.skus) {
        parsedResponse.item.skus.forEach(sku => {
          // If a sku quantity is set to less than 0, we'll set the
          // infinite inventory flag.
          if (sku.quantity < 0) {
            sku.infiniteInventory = true;
          } else {
            sku.infiniteInventory = false;
          }
          // convert the surcharge
          const surcharge = sku.surcharge;
          const isBtc = parsedResponse.metadata &&
            parsedResponse.metadata.pricingCurrency === 'BTC';

          if (surcharge) {
            sku.surcharge = integerToDecimal(surcharge, isBtc);
          }
        });
        // END - convert price fields
      }
    }

    // todo: acceptedCurrency (which is a field we don't use now, but might
    // if we implement cryptocurrency) is comming in with a lower-cased
    // currency code. Capitalize it.

    return parsedResponse;
  }
}
