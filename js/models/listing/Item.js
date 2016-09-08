import app from '../../app';
import { Collection } from 'backbone';
import BaseModel from '../BaseModel';
import Image from './Image';
import is from 'is_js';

class ListingImages extends Collection {
  model(attrs, options) {
    return new Image(attrs, options);
  }
}

export default class extends BaseModel {
  defaults() {
    return {
      title: '',
      description: '',
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

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.title) {
      addError('title', app.polyglot.t('itemModelErrors.provideTitle'));
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

    errObj = this.mergeInNestedModelErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
