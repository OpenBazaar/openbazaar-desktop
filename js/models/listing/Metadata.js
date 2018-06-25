import app from '../../app';
import BaseModel from '../BaseModel';
import is from 'is_js';
import { upToFixed } from '../../utils/number';
import { getCurrencyByCode } from '../../data/currencies';
import { defaultQuantityBaseUnit } from '../../data/cryptoListingCurrencies';

export default class extends BaseModel {
  defaults() {
    return {
      contractType: 'PHYSICAL_GOOD',
      format: 'FIXED_PRICE', // this is not in the design at this time
      // by default, setting to "never" expire (due to a unix bug, the max is before 2038)
      expiry: (new Date(2037, 11, 31, 0, 0, 0, 0)).toISOString(),
      coinDivisibility: defaultQuantityBaseUnit,
    };
  }

  get contractTypes() {
    return [
      'PHYSICAL_GOOD',
      'DIGITAL_GOOD',
      'SERVICE',
      'CRYPTOCURRENCY',
    ];
  }

  get contractTypesVerbose() {
    return this.contractTypes
      .map((contractType) => (
        {
          code: contractType,
          name: app.polyglot.t(`formats.${contractType}`),
        }
      ));
  }

  get formats() {
    return [
      'FIXED_PRICE',
      'MARKET_PRICE',
    ];
  }

  get constraints() {
    return {
      minPriceModifier: -99.99,
      maxPriceModifier: 1000,
    }
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

    if (attrs.contractType === 'CRYPTOCURRENCY' &&
      typeof attrs.priceModifier === 'number') {
      // round to two decimal places
      attrs.priceModifier = parseFloat(upToFixed(attrs.priceModifier, 2));
    }

    return super.set(attrs, opts);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!this.contractTypes.includes(attrs.contractType)) {
      addError('contractType', `The contract type must be one of ${this.contractTypes}.`);
    }

    if (!this.formats.includes(attrs.format)) {
      addError('format', `The format must be one of ${this.formats}.`);
    }

    const firstDayOf2038 = new Date(2038, 0, 1, 0, 0, 0, 0);

    // please provide data as ISO string (or possibly unix timestamp)
    // todo: validate date is provided in the the right format
    if (is.not.inDateRange(new Date(attrs.expiry), new Date(Date.now()), firstDayOf2038)) {
      addError('expiry', 'The expiration date must be between now and the year 2038.');
    }

    if (!attrs.pricingCurrency || !getCurrencyByCode(attrs.pricingCurrency)) {
      addError('pricingCurrency', 'The currency is not one of the available ones.');
    }

    if (attrs.contractType === 'CRYPTOCURRENCY') {
      if (attrs.priceModifier === '') {
        addError('priceModifier', app.polyglot.t('metadataModelErrors.providePriceModifier'));
      } else if (typeof attrs.priceModifier !== 'number') {
        addError('priceModifier', app.polyglot.t('metadataModelErrors.numericPriceModifier'));
      } else if (attrs.priceModifier < this.constraints.minPriceModifier ||
        attrs.priceModifier > this.constraints.maxPriceModifier) {
        addError('priceModifier', app.polyglot.t('metadataModelErrors.priceModifierRange', {
          min: this.constraints.minPriceModifier,
          max: this.constraints.maxPriceModifier,
        }));
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
