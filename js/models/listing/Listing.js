console.log('overshowing save verification modal');

import _ from 'underscore';
import is from 'is_js';
import bigNumber from 'bignumber.js';
import app from '../../app';
import { getCurrencyByCode as getCryptoCurrencyByCode } from '../../data/walletCurrencies';
import { getIndexedCountries } from '../../data/countries';
import { events as listingEvents, shipsFreeToMe } from './';
import {
  decimalToInteger,
  integerToDecimal,
  decimalToCurDef,
  getCurMeta,
  isValidCoinDivisibility,
  getCoinDivisibility,
  CUR_VAL_RANGE_TYPES,
} from '../../utils/currency';
import { isValidNumber } from '../../utils/number';
import BaseModel, { flattenAttrs } from '../BaseModel';
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

  static getIpnsUrl(guid, slug) {
    if (typeof guid !== 'string' || !guid) {
      throw new Error('Please provide a guid as a non-empty ' +
        'string.');
    }

    if (typeof slug !== 'string' || !slug) {
      throw new Error('Please provide a slug as a non-empty ' +
        'string.');
    }

    return app.getServerUrl(`ob/listing/${guid}/${slug}`);
  }

  getIpnsUrl() {
    const slug = this.get('slug');

    if (!slug) {
      throw new Error('In order to fetch a listing via IPNS, a slug must be '
        + 'set as a model attribute.');
    }

    return this.constructor.getIpnsUrl(this.guid, slug);
  }

  static getIpfsUrl(hash) {
    if (typeof hash !== 'string' || !hash) {
      throw new Error('Please provide a hash as a non-empty ' +
        'string.');
    }

    return app.getServerUrl(`ob/listing/ipfs/${hash}`);
  }

  getIpfsUrl(hash) {
    return this.constructor.getIpfsUrl(hash);
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
      // couponCount: 30,
      couponCount: 2,
    };
  }

  get isOwnListing() {
    if (this.guid === undefined) {
      throw new Error('Unable to determine ownListing ' +
        'because a guid has not been set on this model.');
    }

    return app.profile.id === this.guid;
  }

  get isCrypto() {
    return this.get('metadata')
      .get('contractType') === 'CRYPTOCURRENCY';
  }

  get price() {
    const item = this.get('item');
    const metadata = this.get('metadata');

    let coinType = '';

    try {
      coinType = metadata.get('coinType');
    } catch (e) {
      // pass
    }

    if (this.isCrypto) {
      let modifier = 0;

      try {
        modifier = item.get('priceModifier') || 0;
      } catch (e) {
        // pass
      }

      return {
        amount: bigNumber(1 + (modifier / 100)),
        currencyCode: coinType,
        modifier,
      };
    }

    let amount = bigNumber();

    try {
      amount = item.get('bigPrice');
    } catch (e) {
      // pass
    }

    let currencyCode = '';

    try {
      currencyCode = item.get('priceCurrency').code;
    } catch (e) {
      // pass
    }

    return {
      amount,
      currencyCode,
    };
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    let setCurCode;

    try {
      setCurCode =
        attrs.item
          .priceCurrency
          .code;
    } catch (e) {
      // pass
    }

    if (
      typeof setCurCode === 'string' &&
      setCurCode
    ) {
      try {
        attrs.item = {
          ...attrs.item,
          priceCurrency: {
            code: setCurCode,
            divisibility: getCoinDivisibility(setCurCode),
          },
        };
      } catch (e) {
        if (
          attrs.item &&
          typeof attrs.item.priceCurrency === 'object'
        ) {
          delete attrs.item.priceCurrency.divisibility;
          // validate will fail validation on the model in this scenario -
          // it's almost certainly a dev error
        }
      }
    }

    return super.set(attrs, opts);
  }

  /**
   * Returns a new instance of the listing with mostly identical attributes. Certain
   * attributes like slug and hash will be stripped since they are not appropriate
   * if this listing is being used as a template for a new listing. This differs from
   * clone() which will maintain identical attributes.
   */
  cloneListing() {
    const clone = this.clone();
    clone.unset('slug');
    clone.unset('hash');
    clone.guid = this.guid;
    clone.lastSyncedAttrs = {};
    return clone;
  }

  validate(attributes) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const attrs = {
      ...this.toJSON(),
      ...flattenAttrs(attributes),
    };

    const metadata = attrs.metadata;
    const contractType = metadata.contractType;
    const item = attrs.item;

    const curDefCurrency = {
      code: () => item.priceCurrency.code,
      divisibility: () => item.priceCurrency.divisibility,
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

    if (contractType === 'PHYSICAL_GOOD') {
      if (!attrs.shippingOptions.length) {
        addError('shippingOptions', app.polyglot.t('listingModelErrors.provideShippingOption'));
      }
    }

    if (contractType === 'CRYPTOCURRENCY') {
      if (!metadata || !metadata.coinType || typeof metadata.coinType !== 'string') {
        addError('metadata.coinType', app.polyglot.t('metadataModelErrors.provideCoinType'));
      }

      // if (metadata && typeof metadata.pricingCurrency !== 'undefined') {
      //   addError('metadata.pricingCurrency', 'The pricing currency should not be set on ' +
      //     'cryptocurrency listings.');
      // }

      if (item && typeof item.price !== 'undefined') {
        addError('item.price', 'The price should not be set on cryptocurrency ' +
          'listings.');
      }

      if (item && typeof item.condition !== 'undefined') {
        addError('item.condition', 'The condition should not be set on cryptocurrency ' +
          'listings.');
      }

      if (item && typeof item.quantity !== 'undefined') {
        addError('item.quantity', 'The quantity should not be set on cryptocurrency ' +
          'listings.');
      }

      // no shipping

      // this.validateDivisibilityRanges(
      //   item.cryptoQuantity,
      //   coinDiv,
      //   metadata.coinType,
      //   addError,
      //   errObj,
      //   'item.cryptoQuantity'
      // );
    } else {
      if (item && typeof item.cryptoQuantity !== 'undefined') {
        addError('item.cryptoQuantity', 'The cryptoQuantity should only be set on cryptocurrency ' +
          'listings.');
      }

      // this.validateCurrencyAmount(
      //   item.price,
      //   addError,
      //   errObj,
      //   'item.price',
      //   {
      //     coinDiv,
      //     cur: metadata.pricingCurrency,
      //     // these 3 are validated in the Item model
      //     validateRequired: false,
      //     validateType: false,
      //     validateGreaterThanZero: false,
      //   }
      // );

      (attrs.shippingOptions || []).forEach(shipOpt => {
        (shipOpt.services || []).forEach(service => {
          this.validateCurrencyAmount(
            {
              amount: service.bigPrice,
              currency: curDefCurrency,
            },
            addError,
            errObj,
            `shippingOptions[${shipOpt.cid}].services[${service.cid}].bigPrice`,
            {
              validationOptions: {
                rangeType: CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO,
              },
            }
          );

          this.validateCurrencyAmount(
            {
              amount: service.bigAdditionalItemPrice,
              currency: curDefCurrency,
            },
            addError,
            errObj,
            `shippingOptions[${shipOpt.cid}].services[${service.cid}].bigAdditionalItemPrice`,
            {
              validationOptions: {
                rangeType: CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO,
              },
            }
          );
        });
      });

      (item.skus || []).forEach(sku => {
        this.validateCurrencyAmount(
          {
            amount: sku.bigSurcharge,
            currency: curDefCurrency,
          },
          addError,
          errObj,
          `item.skus[${sku.cid}].bigSurcharge`,
          {
            validationOptions: {
              rangeType: CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO,
            },
          }
        );
      });
    }

    if (attrs.coupons.length) {
      const coupons = attrs.coupons;

      if (coupons.length > this.max.couponCount) {
        addError('coupons', app.polyglot.t('listingModelErrors.tooManyCoupons',
          { maxCouponCount: this.max.couponCount }));
      }

      coupons.forEach(coupon => {
        const priceDiscount = coupon.bigPriceDiscount;
        const itemPrice = item.bigPrice;

        this.validateCurrencyAmount(
          {
            amount: priceDiscount,
            currency: curDefCurrency,
          },
          addError,
          errObj,
          `coupons[${coupon.cid}].priceDiscount`,
          {
            translations: {
              required: false,
            },
          }
        );

        if (
          priceDiscount &&
          priceDiscount.isNaN &&
          !priceDiscount.isNaN() &&
          itemPrice &&
          itemPrice.isNaN &&
          !itemPrice.isNaN()
        ) {
          if (priceDiscount.gte(itemPrice)) {
            addError(`coupons[${coupon.cid}].priceDiscount`,
              app.polyglot.t('listingModelErrors.couponsPriceTooLarge'));
          }
        }
      });
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (contractType === 'CRYPTOCURRENCY') {
      // Remove the validation of certain fields that should not be set for
      // cryptocurrency listings.
      delete errObj['metadata.pricingCurrency'];
      delete errObj['item.price'];
      delete errObj['item.condition'];
      delete errObj['item.quantity'];
      delete errObj['item.title'];
    } else {
      delete errObj['item.cryptoQuantity'];
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  fetch(options = {}) {
    if (
      options.hash !== undefined &&
      (
        typeof options.hash !== 'string' ||
        !options.hash
      )
    ) {
      throw new Error('If providing the options.hash, it must be a ' +
        'non-empty string.');
    }

    return super.fetch(options);
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

      options.url = options.url ||
        (
          typeof options.hash === 'string' && options.hash ?
            this.getIpfsUrl(options.hash) :
            this.getIpnsUrl(slug)
        );
    } else {
      if (method !== 'delete') {
        // it's a create or update

        options.url = options.url || app.getServerUrl('ob/listing/');
        options.attrs = options.attrs || this.toJSON();

        const coinDiv = options.attrs.item.priceCurrency.divisibility;

        options.attrs.item = {
          ...options.attrs.item,
          ...decimalToCurDef(
            options.attrs.item.bigPrice,
            options.attrs.item.priceCurrency.code,
            {
              amountKey: 'bigPrice',
              currencyKey: 'priceCurrency',
              divisibility: coinDiv,
            }
          ),
        };

        options.attrs.shippingOptions.forEach(shipOpt => {
          shipOpt.services.forEach(service => {
            service.bigPrice = decimalToInteger(
              service.bigPrice,
              coinDiv
            );
            service.bigAdditionalItemPrice =
              decimalToInteger(
                service.bigAdditionalItemPrice,
                coinDiv
              );
          });
        });

        options.attrs.coupons.forEach(coupon => {
          if (coupon.bigPriceDiscount) {
            coupon.bigPriceDiscount =
              decimalToInteger(coupon.bigPriceDiscount, coinDiv);
          }
        });

        // If providing a quanitity and/or productID on the Item and not
        // providing any SKUs, then we'll send item.quantity and item.productID
        // in as a "dummy" SKU (as the server expects). If you are providing any
        // SKUs, then item.quantity and item.productID will be ignored.
        if (!options.attrs.item.skus.length) {
          const dummySku = {};

          if (options.attrs.metadata.contractType === 'CRYPTOCURRENCY') {
            dummySku.bigQuantity = decimalToInteger(
              options.attrs.item.cryptoQuantity,
              options.attrs.metadata.coinDivisibility
            );

            delete options.attrs.item.cryptoQuantity;
          } else if (typeof options.attrs.item.quantity === 'number') {
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
            sku.bigSurcharge = decimalToInteger(sku.bigSurcharge, coinDiv);
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

        if (options.attrs.metadata.contractType === 'CRYPTOCURRENCY') {
          // Don't send over the price on crypto listings.
          delete options.attrs.item.bigPrice;

          // Update the crypto title based on the accepted currency and
          // coin type.
          const coinType = options.attrs.metadata.coinType;
          let fromCur = options.attrs.metadata.acceptedCurrencies &&
            options.attrs.metadata.acceptedCurrencies[0];
          if (fromCur) {
            const curObj = getCryptoCurrencyByCode(fromCur);
            // if it's a recognized currency, ensure the mainnet code is used
            fromCur = curObj ? curObj.code : fromCur;
          } else {
            fromCur = 'UNKNOWN';
          }
          options.attrs.item.title = `${fromCur}-${coinType}`;
        } else {
          // Don't send over crypto currency specific fields if it's not a
          // crypto listing.
          delete options.attrs.item.priceModifier;
        }
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
          prev: attrsBeforeSync,
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
    this.unparsedResponse = JSON.parse(JSON.stringify(response)); // deep clone
    const parsedResponse = response.listing;

    if (parsedResponse) {
      const isCrypto = parsedResponse.metadata &&
        parsedResponse.metadata.contractType === 'CRYPTOCURRENCY';

      // set the hash
      parsedResponse.hash = response.hash;

      let coinDiv;

      try {
        coinDiv =
          parsedResponse
            .item
            .priceCurrency
            .divisibility;
      } catch (e) {
        // pass
      }

      const [isValidCoinDiv] = isValidCoinDivisibility(coinDiv);

      if (!isValidCoinDiv) {
        console.error('Unable to convert price fields. The coin divisibility is not valid.');
      }

      try {
        parsedResponse.item.bigPrice = integerToDecimal(parsedResponse.item.bigPrice, coinDiv);
      } catch (e) {
        parsedResponse.item.bigPrice = '';
        console.error(`Unable to convert the bigPrice: ${e.message}`);
      }

      if (parsedResponse.shippingOptions && parsedResponse.shippingOptions.length) {
        parsedResponse.shippingOptions.forEach((shipOpt, shipOptIndex) => {
          if (shipOpt.services && shipOpt.services.length) {
            shipOpt.services.forEach(service => {
              try {
                service.bigPrice = integerToDecimal(service.bigPrice, coinDiv);
              } catch (e) {
                service.bigPrice = '';
                console.error(`Unable to convert the service bigPrice: ${e.message}`);
              }

              try {
                service.bigAdditionalItemPrice =
                  integerToDecimal(service.bigAdditionalItemPrice, coinDiv);
              } catch (e) {
                service.bigAdditionalItemPrice = '';
                console.error(`Unable to convert the service bigAdditionalItemPrice: ${e.message}`);
              }
            });
          }

          // If the shipping regions are set to 'ALL', we'll replace with a list of individual
          // countries, which is what our UI is designed to work with.
          if (shipOpt.regions && shipOpt.regions.length && shipOpt.regions[0] === 'ALL') {
            parsedResponse.shippingOptions[shipOptIndex].regions =
              Object.keys(getIndexedCountries());
          }
        });
      }

      if (parsedResponse.coupons) {
        parsedResponse.coupons.forEach(coupon => {
          try {
            coupon.bigPriceDiscount =
              integerToDecimal(coupon.bigPriceDiscount, coinDiv);
          } catch (e) {
            coupon.bigPriceDiscount = '';
            console.error(`Unable to convert the coupon bigPriceDiscount: ${e.message}`);
          }
        });
      }

      // Re-organize variant structure so a "dummy" SKU (if present) has its quanitity
      // and productID moved to be attributes of the Item model
      if (parsedResponse.item && parsedResponse.item.skus &&
        parsedResponse.item.skus.length === 1 &&
        typeof parsedResponse.item.skus[0].variantCombo === 'undefined') {
        const dummySku = parsedResponse.item.skus[0];

        if (isCrypto) {
          try {
            parsedResponse.item.cryptoQuantity = integerToDecimal(
              dummySku.bigQuantity,
              parsedResponse.metadata.coinDivisibility
            );
          } catch (e) {
            console.error(
              `Unable to convert the crypto currency listing bigQuantity: ${e.message}`
            );
          }
        } else {
          parsedResponse.item.quantity = dummySku.quantity;
        }

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
          const bigSurcharge = sku.bigSurcharge;

          if (bigSurcharge) {
            try {
              sku.bigSurcharge = integerToDecimal(bigSurcharge, coinDiv);
            } catch (e) {
              sku.bigSurcharge = '';
              console.error(`Unable to convert the bigSurcharge: ${e.message}`);
            }
          }
        });
      }

      if (parsedResponse.metadata) {
        parsedResponse.metadata.acceptedCurrencies =
          parsedResponse.metadata.acceptedCurrencies || [];
      }
    }

    return parsedResponse;
  }
}
