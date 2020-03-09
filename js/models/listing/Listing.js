console.log('overshowing save verification modal on crypto listing');

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
  isValidCoinDivisibility,
  getCoinDivisibility,
  CUR_VAL_RANGE_TYPES,
  defaultCryptoCoinDivisibility,
  UnrecognizedCurrencyError,
} from '../../utils/currency';
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
      couponCount: 30,
      minPriceModifier: -99.99,
      maxPriceModifier: 1000,
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

    let contractType;

    try {
      contractType =
        this.get('metadata')
          .get('contractType');
    } catch (e) {
      // pass
    }

    try {
      contractType = attrs.metadata.contractType;
    } catch (e) {
      // pass
    }

    if (contractType !== 'CRYPTOCURRENCY') {
      let curCode;

      try {
        curCode =
          attrs.item
            .priceCurrency
            .code;
      } catch (e) {
        // pass
      }

      if (
        typeof curCode === 'string' &&
        curCode
      ) {
        try {
          attrs.item = {
            ...attrs.item,
            priceCurrency: {
              code: curCode,
              divisibility: getCoinDivisibility(curCode),
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
    } else {
      let coinType;

      try {
        coinType =
          attrs.metadata
            .coinType;
      } catch (e) {
        // pass
      }

      if (
        typeof coinType === 'string' &&
        coinType
      ) {
        try {
          attrs.metadata.coinDivisibility = getCoinDivisibility(coinType);
        } catch (e) {
          if (e instanceof UnrecognizedCurrencyError) {
            // If it's a coin we don't recognize and it has a valid divsibility
            // set (maybe it came from another client that knows more about the coin
            // than us), we'll use it. Otherwise, we'll use the default crypto coin
            // divisibility.
            let coinDiv = defaultCryptoCoinDivisibility;
            const curDivis = this.get('metadata') &&
              this.get('metadata').get('coinDivisibility');

            try {
              if (isValidCoinDivisibility(curDivis)[0]) {
                coinDiv = curDivis;
              }
            } catch (err) {
              // pass
            }

            attrs.metadata.coinDivisibility = coinDiv;
          } else {
            if (attrs.metadata) {
              delete attrs.metadata.coinDivisibility;
              // validate will fail validation on the model in this scenario -
              // it's almost certainly a dev error
            }
          }
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

    if (!(attributes.item instanceof Item)) {
      addError('item', 'A nested Item model is required.');
    }

    if (!(attributes.metadata instanceof Metadata)) {
      addError('metadata', 'A nested Metadata model is required.');
    }

    if (!(attributes.shippingOptions instanceof ShippingOptions)) {
      addError('shippingOptions', 'A nested ShippingOptions collection is required.');
    }

    if (!(attributes.coupons instanceof Coupons)) {
      addError('coupons', 'A nested Coupons collection is required.');
    }

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

      if (item) {
        if (typeof item.price !== 'undefined') {
          addError('item.price', 'The price should not be set on cryptocurrency ' +
            'listings.');
        }

        if (typeof item.condition !== 'undefined') {
          addError('item.condition', 'The condition should not be set on cryptocurrency ' +
            'listings.');
        }

        if (typeof item.quantity !== 'undefined') {
          addError('item.quantity', 'The quantity should not be set on cryptocurrency ' +
            'listings.');
        }

        if (
          item.priceModifier === '' ||
          item.priceModifier === undefined ||
          item.priceModifier === null
        ) {
          addError('item.priceModifier', app.polyglot.t('listingModelErrors.providePriceModifier'));
        } else if (typeof item.priceModifier !== 'number') {
          addError('item.priceModifier', app.polyglot.t('listingModelErrors.numericPriceModifier'));
        } else if (
          item.priceModifier < this.max.minPriceModifier ||
          item.priceModifier > this.max.maxPriceModifier
        ) {
          addError('item.priceModifier', app.polyglot.t('listingModelErrors.priceModifierRange', {
            min: this.max.minPriceModifier,
            max: this.max.maxPriceModifier,
          }));
        }

        this.validateCurrencyAmount(
          {
            amount: item.cryptoQuantity,
            currency: {
              code: () => metadata.coinType,
              divisibility: () => metadata.coinDivisibility,
            },
          },
          addError,
          'item.cryptoQuantity',
          {
            validationOptions: {
              rangeType: CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO,
            },
          }
        );
      }
    } else {
      if (item && typeof item.cryptoQuantity !== 'undefined') {
        addError('item.cryptoQuantity', 'The cryptoQuantity should only be set on cryptocurrency ' +
          'listings.');
      }

      (attrs.shippingOptions || []).forEach(shipOpt => {
        (shipOpt.services || []).forEach(service => {
          this.validateCurrencyAmount(
            {
              amount: service.bigPrice,
              currency: curDefCurrency,
            },
            addError,
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
          `coupons[${coupon.cid}].bigPriceDiscount`,
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
            addError(`coupons[${coupon.cid}].bigPriceDiscount`,
              app.polyglot.t('listingModelErrors.couponsPriceTooLarge'));
          }
        }
      });
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (contractType === 'CRYPTOCURRENCY') {
      // Remove the validation of certain fields that should not be set for
      // cryptocurrency listings.
      Object
        .keys(errObj)
        .forEach(errKey => {
          if (errKey.startsWith('item.priceCurrency')) {
            delete errObj[errKey];
          }
        });

      delete errObj['item.bigPrice'];
      delete errObj['item.condition'];
      delete errObj['item.quantity'];
      delete errObj['item.title'];
    } else {
      delete errObj['item.cryptoQuantity'];
      delete errObj['item.priceModifier'];
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

        let coinDiv;

        if (options.attrs.metadata.contractType !== 'CRYPTOCURRENCY') {
          // Don't send over crypto currency specific fields if it's not a
          // crypto listing.
          delete options.attrs.item.priceModifier;
          delete options.attrs.item.cryptoQuantity;

          coinDiv = options.attrs.item.priceCurrency.divisibility;

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

          options.attrs.item.skus.forEach(sku => {
            sku.bigSurcharge = decimalToInteger(sku.bigSurcharge, coinDiv);
          });
        } else {
          // Don't send over the price on crypto listings.
          delete options.attrs.item.bigPrice;
          delete options.attrs.item.priceCurrency;
          delete options.attrs.item.options;

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
        }

        // If providing a quanitity, productID or infiniteInventory bool on the
        // Item and not providing any SKUs, then we'll send them in as a "dummy" SKU
        // (as the server expects).
        if (!options.attrs.item.skus.length) {
          const dummySku = {};

          if (options.attrs.metadata.contractType === 'CRYPTOCURRENCY') {
            dummySku.bigQuantity = decimalToInteger(
              options.attrs.item.cryptoQuantity,
              options.attrs.metadata.coinDivisibility
            );

            delete options.attrs.item.cryptoQuantity;
          } else if (options.attrs.item.infiniteInventory) {
            dummySku.bigQuantity = '-1';
          } else if (options.attrs.item.quantity instanceof bigNumber) {
            dummySku.bigQuantity = options.attrs.item.quantity;
          }

          if (
            options.attrs.metadata.contractType !== 'CRYPTOCURRENCY' &&
            typeof options.attrs.item.productID === 'string' &&
            options.attrs.item.productID.length
          ) {
            dummySku.productID = options.attrs.item.productID;
          }

          if (Object.keys(dummySku).length) {
            options.attrs.item.skus = [dummySku];
          }

          delete options.attrs.item.infiniteInventory;
        }

        delete options.attrs.item.productID;
        delete options.attrs.item.quantity;

        // Our Sku has an infinteInventory boolean attribute, but the server
        // is expecting a quantity negative quantity in that case.
        options.attrs.item.skus.forEach(sku => {
          if (sku.infiniteInventory) {
            sku.bigQuantity = bigNumber('-1');
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

        if (app.serverConfig.testnet) {
          options.attrs.metadata.escrowTimeoutHours =
            options.attrs.metadata.escrowTimeoutHours === undefined ?
              1 : options.attrs.metadata.escrowTimeoutHours;
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

      // delete some deprecated properties
      if (parsedResponse.item) {
        if (parsedResponse.metadata) {
          delete parsedResponse.metadata.priceModifier;
        }

        delete parsedResponse.item.price;

        if (Array.isArray(parsedResponse.item.skus)) {
          parsedResponse.item.skus.forEach(sku => {
            delete sku.surcharge;
            delete sku.quantity;
          });
        }
      }

      let coinDiv;

      try {
        coinDiv = isCrypto ?
          parsedResponse
            .metadata
            .coinDivisibility :
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

      if (!isCrypto) {
        if (parsedResponse.metadata) {
          delete parsedResponse.metadata.priceModifier;
        }

        if (parsedResponse.item) {
          parsedResponse.item.bigPrice =
            integerToDecimal(
              parsedResponse.item.bigPrice,
              coinDiv,
              { fieldName: 'item.bigPrice' }
            );
        }

        if (parsedResponse.shippingOptions && parsedResponse.shippingOptions.length) {
          parsedResponse.shippingOptions.forEach((shipOpt, shipOptIndex) => {
            if (shipOpt.services && shipOpt.services.length) {
              shipOpt.services.forEach(service => {
                service.bigPrice = integerToDecimal(
                  service.bigPrice,
                  coinDiv,
                  { fieldName: 'service.bigPrice' }
                );
                service.bigAdditionalItemPrice =
                  integerToDecimal(
                    service.bigAdditionalItemPrice,
                    coinDiv,
                    { fieldName: 'service.bigAdditionalItemPrice' }
                  );
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
            if (coupon.bigPriceDiscount) {
              coupon.bigPriceDiscount =
                integerToDecimal(
                  coupon.bigPriceDiscount,
                  coinDiv,
                  { fieldName: 'coupon.bigPriceDiscount' }
                );
            }
          });
        }
      }

      // Re-organize variant structure so a "dummy" SKU (if present) has its quanitity
      // and productID moved to be attributes of the Item model
      if (
        parsedResponse.item && parsedResponse.item.skus &&
        parsedResponse.item.skus.length === 1 &&
        typeof parsedResponse.item.skus[0].variantCombo === 'undefined'
      ) {
        const dummySku = parsedResponse.item.skus[0];

        if (isCrypto) {
          parsedResponse.item.cryptoQuantity = integerToDecimal(
            dummySku.bigQuantity,
            parsedResponse.metadata.coinDivisibility,
            { fieldName: 'sku.bigQuantity' }
          );
        } else {
          parsedResponse.item.quantity = dummySku.bigQuantity;
        }

        parsedResponse.item.productID = dummySku.productID;
        delete parsedResponse.item.skus;
      } else if (parsedResponse.item && parsedResponse.item.skus) {
        parsedResponse.item.skus.forEach(sku => {
          // If a sku quantity is set to less than 0, we'll set the
          // infinite inventory flag.
          if (bigNumber(sku.bigQuantity).lt(0)) {
            sku.infiniteInventory = true;
          } else {
            sku.infiniteInventory = false;
          }

          // convert the surcharge
          const bigSurcharge = sku.bigSurcharge;

          if (bigSurcharge) {
            sku.bigSurcharge = integerToDecimal(
              bigSurcharge,
              coinDiv,
              { fieldName: 'sku.bigSurcharge' }
            );
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
