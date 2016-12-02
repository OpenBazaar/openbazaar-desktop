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

  get max() {
    return {
      descriptionLength: 50000,
      images: 30,
      tags: 10,
      cats: 10,
      titleLength: 140,
      // tagLength: 40,
      tagLength: 4,
    };
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

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
