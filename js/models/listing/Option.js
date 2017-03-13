import is from 'is_js';
// import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      description: '',
      variants: [],
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
      variantItemLength: 40,
    };
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      // TRANSLATE!
      addError('name', 'Please provide a title.');
    } else if (attrs.name.length > this.max.nameLength) {
      // TRANSLATE!
      addError('name', `The name cannot exceed ${this.max.nameLength} characters.`);
    }

    if (attrs.description.length > this.max.descriptionLength) {
      // TRANSLATE!
      addError('description',
        `The description cannot exceed ${this.max.descriptionLength} characters.`);
    }

    if (!is.array(attrs.variants)) {
      addError('variants', 'The variants must be provided as an array.');
    } else {
      if (attrs.variants.length > this.max.variantCount) {
        // TRANSLATE!
        addError('variants',
          `You have more than the maximum allowable amount of ${this.max.variantCount} choices.`);
      } else if (attrs.variants.length < 2) {
        // TRANSLATE! Variabalize the count for the translation.
        addError('variants', 'You must provide at least 2 choices.');
      }

      attrs.variants.forEach(variant => {
        if (variant.length > this.max.variantItemLength) {
          // TRANSLATE!
          addError('variants',
            `${variant} exceeds the maximum length of ${this.max.variantItemLength} characters.`);
        }
      });
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
