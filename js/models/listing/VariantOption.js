import app from '../../app';
import { guid } from '../../utils';
import Variants from '../../collections/listing/Variants';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    super({
      ...attrs,
      _clientID: attrs._clientID || guid(),
    }, options);
  }

  defaults() {
    return {
      name: '',
      description: '',
      variants: new Variants(),
    };
  }

  get nested() {
    return {
      variants: Variants,
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  get max() {
    return {
      nameLength: 40,
      descriptionLength: 70,
      variantCount: 30,
    };
  }

  validate(attrs) {
    let errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('name', app.polyglot.t('variantOptionModelErrors.provideName'));
    } else if (attrs.name.length > this.max.nameLength) {
      addError('name', `The name cannot exceed ${this.max.nameLength} characters.`);
    }

    if (attrs.description.length > this.max.descriptionLength) {
      addError('description',
        `The description cannot exceed ${this.max.descriptionLength} characters.`);
    }

    if (attrs.variants.length > this.max.variantCount) {
      addError('variants',
        `You have more than the maximum allowable amount of ${this.max.variantCount} choices.`);
    } else if (attrs.variants.length < 2) {
      addError('variants', app.polyglot.t('variantOptionModelErrors.atLeast2Variants'));
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
