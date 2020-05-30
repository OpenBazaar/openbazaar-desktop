import is from 'is_js';
import { Collection } from 'backbone';
import { guid } from '../../utils';
import { isValidNumber } from '../../utils/number';
import app from '../../app';
import { getCurrencyByCode } from '../../data/currencies';
import { isValidCoinDivisibility } from '../../utils/currency';
import BaseModel from '../BaseModel';
import Image from './Image';
import VariantOptions from '../../collections/listing/VariantOptions';
import Skus from '../../collections/listing/Skus';

/*
 * This model has a few inventory related properties that don't directly map to the
 * API. When a listing does not have variants but tracks inventory, the server handles
 * the quantity and productId values in a "dummy" SKU, e.g:
 *
 * skus: [{ quantity: "123", productId: "54321" }]
 *
 * Since that is, arguably, awkward, instead this model offers a few properties to track
 * non-variant inventory:
 *
 * productId - a string that maps to "skus: [{ productId: "54321" }]"
 * quantity - a bigNumber that maps to "skus: [{ quantity: "123" }]" (used
 *   for non-crypto listings)
 * cryptoQuantity - a bigNumber that maps to "skus: [{ quantity: "123" }]"
 *   (used for crypto listings)
 * infiniteInventory - a boolean that maps to "skus: [{ quantity: "-1" }]".
 *
 * Parse/Sync of the listing model will handle mapping to/from the server version
 * and what's in this model.
 *
 * Please note: If your listing does include variants, you will want to use the
 * quantity and infiniteInventory fields on the SKU model instead of setting
 * anything on this model related to those fields.
 */

class ListingImages extends Collection {
  model(attrs, options) {
    return new Image({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}

export default class extends BaseModel {
  defaults() {
    return {
      title: '',
      description: '',
      tags: [],
      categories: [],
      nsfw: false,
      condition: 'NEW',
      images: new ListingImages(),
      options: new VariantOptions(),
      skus: new Skus(),
      infiniteInventory: true,
    };
  }

  get nested() {
    return {
      images: ListingImages,
      options: VariantOptions,
      skus: Skus,
    };
  }

  get conditionTypes() {
    return [
      'NEW',
      'USED_EXCELLENT',
      'USED_GOOD',
      'USED_POOR',
      'REFURBISHED',
    ];
  }

  get max() {
    return {
      descriptionLength: 50000,
      images: 30,
      tags: 10,
      cats: 10,
      titleLength: 140,
      tagLength: 40,
      productIdLength: 40,
      optionCount: 30,
    };
  }

  get isInventoryTracked() {
    let isInventoryTracked = false;

    if (this.get('options').length) {
      // If we have options and at least one has a non-infinite inventory,
      // we'll consider you to be tracking inventory
      isInventoryTracked = !!this.get('skus')
        .find(sku => !sku.get('infiniteInventory'));
    } else {
      // If you don't have any options and have the top level as a non-negative
      // value (i.e. not infiniteInventory), we'll consider you to be tracking inventory
      isInventoryTracked = this.get('quantity') >= 0;
    }

    return isInventoryTracked;
  }

  validate(attrs) {
    let errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const max = this.max;

    if (!attrs.title) {
      addError('title', app.polyglot.t('itemModelErrors.provideTitle'));
    } else if (attrs.title.length > max.titleLength) {
      addError('title', app.polyglot.t('itemModelErrors.titleTooLong'));
    }

    if (this.conditionTypes.indexOf(attrs.condition) === -1) {
      addError('condition', app.polyglot.t('itemModelErrors.badConditionType'));
    }

    if (is.not.string(attrs.description)) {
      addError('description', 'The description must be of type string.');
    } else if (attrs.description.length > max.descriptionLength) {
      addError('description', app.polyglot.t('itemModelErrors.descriptionTooLong'));
    }

    if (!attrs.images.length) {
      addError('images', app.polyglot.t('itemModelErrors.imageRequired'));
    } else if (attrs.images.length > max.images) {
      addError('images', `The number of images cannot exceed ${max.images}`);
    }

    if (attrs.tags) {
      if (is.array(attrs.tags)) {
        if (attrs.tags.length > max.tags) {
          addError('tags',
            app.polyglot.t('itemModelErrors.tooManyTags', { maxTags: max.tags }));
        }

        attrs.tags.forEach((tag, index) => {
          if (is.not.string(tag)) {
            addError('tags', `Tag at index ${index} is not a string and should be.`);
          } else if (tag.length > this.max.tagLength) {
            addError('tags', `Tag ${tag} exceeds the maximum tag length of ${this.max.tagLength}.`);
          }
        });
      } else {
        addError('tags', 'Tags must be provided as an array.');
      }
    }

    if (attrs.categories && attrs.categories.length > max.cats) {
      addError('categories',
        app.polyglot.t('itemModelErrors.tooManyCats', { maxCats: max.cats }));
    }

    // Quantity and productId are not allowed on the Item in the listing API. Instead they are
    // accomplished via a "dummy" Sku object. Since that seems a bit klunky, out model will
    // allow them and the Listing model will do the translation in parse / sync. If this is a
    // crypto listing then item.cryptoQuantity will be created in liu of item.quantity.
    if (attrs.productId && attrs.productId.length > this.max.productIdLength) {
      addError('productId', `The productId cannot exceed ${this.max.productIdLength} characters.`);
    }

    if (attrs.infiniteInventory) {
      if (typeof attrs.quantity !== 'undefined') {
        addError('quantity', 'Quantity should not be set if infiniteInventory is truthy.');
      }
    } else if (attrs.skus && attrs.skus.length) {
      if (attrs.quantity !== undefined) {
        addError('quantity', 'Quantity should not be set if providing Skus.');
      }
    } else {
      if (
        attrs.quantity === 'undefined' ||
        attrs.quantity === null ||
        attrs.quantity === ''
      ) {
        addError('quantity', app.polyglot.t('itemModelErrors.provideQuantity'));
      } else if (
        !isValidNumber(attrs.quantity, {
          allowNumber: false,
          allowBigNumber: true,
          allowString: false,
        })
      ) {
        addError('quantity', app.polyglot.t('itemModelErrors.provideNumericQuantity'));
      } else if (attrs.quantity.lt(0)) {
        addError('quantity', app.polyglot.t('itemModelErrors.quantityMustBePositive'));
      } else if (!attrs.quantity.isInteger()) {
        addError('quantity', app.polyglot.t('itemModelErrors.quantityMustBeInteger'));
      }
    }

    if (attrs.skus && attrs.skus.length && attrs.cryptoQuantity !== undefined) {
      addError('cryptoQuantity', 'CryptoQuantity should not be set if providing Skus.');
    }

    let maxCombos = 1;

    attrs.options.forEach(option => (maxCombos *=
      (option.get('variants') && option.get('variants').length || 1)));

    if (attrs.skus.length > maxCombos) {
      addError('skus', 'You have provided more SKUs than variant combinations.');
    }

    // ensure no SKUs with the same variantCombo
    // http://stackoverflow.com/a/24968449/632806
    const uniqueSkus = attrs.skus.map(sku =>
      ({ count: 1, name: JSON.stringify(sku.get('variantCombo')) }))
      .reduce((a, b) => {
        a[b.name] = (a[b.name] || 0) + b.count;
        return a;
      }, {});

    const duplicateSkus = Object.keys(uniqueSkus).filter((a) => uniqueSkus[a] > 1);

    duplicateSkus.forEach(dupeSku => {
      addError('skus', `Variant combos must be unique. ${dupeSku} is duplicated.`);
    });

    attrs.skus.forEach(sku => {
      const varCombo = sku.variantCombo;

      // ensure that each SKU has a variantCombo with the correct length
      // (which is the length of the options)
      if (is.array(varCombo)) {
        // ensure the variantCombo actually corresponds to a provided option.variant value
        varCombo.forEach((val, index) => {
          if (!attrs.options[index] ||
            !attrs.options[index].variants ||
            !attrs.options[index].variants.length ||
            !attrs.options[index].variants[val]) {
            addError('skus', `Invalid variant combo ${JSON.stringify(varCombo)}.`);
          }
        });
      }
    });

    // Ensure no duplicate VariantOption names.
    const optionsNames = attrs.options.map(option => option.get('name'));
    attrs.options.forEach((option, index) => {
      if (optionsNames.indexOf(option.get('name')) !== index) {
        addError(`options[${option.cid}].name`,
          app.polyglot.t('itemModelErrors.duplicateOptionName'));
      }

      // Ensure no duplicate variant names.
      const variantNames = option.get('variants').map(variant => variant.get('name'));
      option.get('variants').forEach((variant, vIndex) => {
        if (variantNames.indexOf(variant.get('name')) !== vIndex) {
          const key = `options[${option.cid}].` +
            `variants[${variant.cid}].name`;
          addError(key, app.polyglot.t('itemModelErrors.duplicateVariantName', {
            name: variant.get('name'),
          }));
        }
      });
    });

    if (attrs.options.length > this.max.optionCount) {
      addError('options', app.polyglot.t('itemModelErrors.tooManyOptions',
        { maxOptionCount: this.max.optionCount }));
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
