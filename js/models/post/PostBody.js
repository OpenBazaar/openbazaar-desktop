import { guid } from '../../utils';
// import is from 'is_js';
import app from '../../app';
import { Collection } from 'backbone';
import BaseModel from '../BaseModel';
import Image from '../listing/Image';

class PostImages extends Collection {
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
      images: new PostImages(),
    };
  }

  get nested() {
    return {
      images: PostImages,
    };
  }

  get max() {
    return {
      images: 30,
      titleLength: 140,
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

    if (!attrs.images.length) {
      addError('images', app.polyglot.t('itemModelErrors.imageRequired'));
    } else if (attrs.images.length > max.images) {
      addError('images', `The number of images cannot exceed ${max.images}`);
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
