import BaseModel from '../BaseModel';
import Item from './Item';
import Metadata from './Metadata';
import is from 'is_js';

export default class extends BaseModel {
  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  get nested() {
    return {
      item: Item,
      metadata: Metadata,
    };
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.string(attrs.slug)) {
      addError('slug', 'Please provide a slug as a string.');
    } else if (!attrs.slug) {
      addError('slug', 'Please provide a slug.');
    }

    errObj = this.mergeInNestedModelErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
