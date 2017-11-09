import BaseModel from '../BaseModel';
import app from '../../app';
import Fee from './Fee';

export default class extends BaseModel {
  defaults() {
    return {
      fee: new Fee(),
      description: '',
      termsAndConditions: '',
      languages: [],
    };
  }

  get nested() {
    return {
      fee: Fee,
    };
  }

  get max() {
    return {
      descriptionLength: 300,
      termsLength: 10000,
    };
  }

  validate(attrs, options = {}) {
    const opts = {
      validateRequiredFields: true,
      ...options || {},
    };
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };
    const max = this.max;

    if (!attrs.description) {
      if (opts.validateRequiredFields) {
        addError('description',
          app.polyglot.t('moderatorModelErrors.noDescription'));
      }
    } else if (attrs.description.length > max.descriptionLength) {
      addError('description',
        app.polyglot.t('moderatorModelErrors.descriptionLength'));
    }

    if (!attrs.termsAndConditions) {
      if (opts.validateRequiredFields) {
        addError('termsAndConditions',
          app.polyglot.t('moderatorModelErrors.noTerms'));
      }
    } else if (attrs.termsAndConditions.length > max.termsLength) {
      addError('termsAndConditions',
        app.polyglot.t('moderatorModelErrors.termsLength'));
    }

    if (!Array.isArray(attrs.languages)) {
      addError('languages', 'Languages must be provided as an array.');
    } else if (!attrs.languages.length) {
      if (opts.validateRequiredFields) {
        addError('languages',
          app.polyglot.t('moderatorModelErrors.noLanguages'));
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
