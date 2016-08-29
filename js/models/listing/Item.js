import { Collection } from 'backbone';
import BaseModel from '../BaseModel';
import Price from './Price';
import Image from './Image';
// import is from 'is_js';

class ListingImages extends Collection {
  model(attrs, options) {
    return new Image(attrs, options);
  }
}

export default class extends BaseModel {
  defaults() {
    return {
      // slug: 'foo-bar-baz',
      title: '',
    };
  }

  nested() {
    return {
      price: Price,
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

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.title) {
      addError('title', 'Please provide a title.');
    }

    if (this.conditionTypes.indexOf(attrs.condition) === -1) {
      addError('condition', 'The condition type is not one of the available types.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
