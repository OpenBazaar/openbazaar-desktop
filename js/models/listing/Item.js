import { guid } from '../../utils';
import is from 'is_js';
import app from '../../app';
import { Collection } from 'backbone';
import BaseModel from '../BaseModel';
import Image from './Image';
import VariantOptions from '../../collections/listing/VariantOptions';
import Skus from '../../collections/listing/Skus';

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
      optionCount: 3,
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
      // If you don't have any options and have the top level infiniteInventory set to true,
      // we'll consider you to be tracking inventory
      isInventoryTracked = typeof this.get('quantity') !== 'undefined';
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

    if (attrs.price === '') {
      addError('price', app.polyglot.t('itemModelErrors.provideAmount'));
    } else if (is.not.number(attrs.price)) {
      addError('price', app.polyglot.t('itemModelErrors.provideNumericAmount'));
    } else if (attrs.price <= 0) {
      addError('price', app.polyglot.t('itemModelErrors.provideAmountGreaterThanZero'));
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

    // quantity and productId are not allowed on the Item in the listing API. Instead they are
    // accomplished via a "dummy" Sku object. Since that seems a bit klunky, out model will
    // allow them and the Listing model will do the translation in parse / sync.
    if (attrs.productId && attrs.productId.length > this.max.productIdLength) {
      // TRANSLATE!
      addError('productId', `The productId cannot exceed ${this.max.productIdLength} characters.`);
    }

    if (typeof attrs.quantity !== 'undefined') {
      // If providing a top-level quantity, we'll validate it. It should only be provided
      // if you are tracking inventory and have no options (i.e. are not tracking inventory
      // on the variant level).
      if (typeof attrs.quantity === 'string' && !attrs.quantity) {
        // TRANSLATE!
        addError('quantity', 'Please provide a quantity.');
      } else if (typeof attrs.quantity !== 'number') {
        // TRANSLATE!
        addError('quantity', 'The quantity must be a number.');
      } else if (attrs.quantity < 0) {
        // TRANSLATE!
        addError('quantity', 'The quantity cannot be less than 0.');
      }
    }
    // END - quantity and productId

    let maxCombos = 1;

    attrs.options.forEach(option => (maxCombos *=
      (option.get('variants') && option.get('variants').length || 0)));

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

    if (attrs.options.length > this.max.optionCount) {
      addError('options', app.polyglot.t('itemModelErrors.tooManyOptions',
        { maxOptionCount: this.max.optionCount }));
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
