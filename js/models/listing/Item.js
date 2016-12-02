import { guid } from '../../utils';
import is from 'is_js';
import app from '../../app';
import { Collection } from 'backbone';
import BaseModel from '../BaseModel';
import Image from './Image';

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
      sku: '',
      nsfw: false,
      condition: 'NEW',
    };
  }

  get nested() {
    return {
      images: ListingImages,
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

  get descriptionMaxLength() {
    return 50000;
  }

  get maxImages() {
    return 10;
  }

  get maxTags() {
    return 10;
  }

  get maxCategories() {
    return 10;
  }

  get titleMaxLength() {
    return 140;
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.title) {
      addError('title', app.polyglot.t('itemModelErrors.provideTitle'));
    } else if (attrs.title.length > this.titleMaxLength) {
      addError('title', app.polyglot.t('itemModelErrors.titleTooLong'));
    }

    if (this.conditionTypes.indexOf(attrs.condition) === -1) {
      addError('condition', app.polyglot.t('itemModelErrors.badConditionType'));
    }

    if (is.not.string(attrs.description)) {
      addError('description', 'The description must be of type string.');
    } else if (attrs.description.length > this.descriptionMaxLength) {
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
    } else if (attrs.images.length > this.maxImages) {
      addError('images', `The number of images cannot exceed ${this.maxImages}`);
    }

    if (attrs.tags && attrs.tags.length > this.maxTags) {
      addError('tags',
        app.polyglot.t('itemModelErrors.tooManyTags', { maxTags: this.maxTags }));
    }

    if (attrs.categories && attrs.categories.length > this.maxCategories) {
      addError('categories',
        app.polyglot.t('itemModelErrors.tooManyCats', { maxCats: this.maxCategories }));
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
