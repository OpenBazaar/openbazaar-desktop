import BaseModel from '../BaseModel';
import app from '../../app';
import Fee from './Fee';

export default class extends BaseModel {
  defaults() {
    return {
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

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.description) {
      addError('description', app.polyglot.t('settings.moderationTab.errors.noDescription'));
    }

    if (attrs.description.length > 300) {
      addError('description', app.polyglot.t('settings.moderationTab.errors.descriptionLength'));
    }

    if (!attrs.termsAndConditions) {
      addError('termsAndConditions', app.polyglot.t('settings.moderationTab.errors.noTerms'));
    }

    if (attrs.termsAndConditions.length > 10000) {
      addError('termsAndConditions', app.polyglot.t('settings.moderationTab.errors.termsLength'));
    }

    if (!attrs.languages.length) {
      addError('languages', app.polyglot.t('settings.moderationTab.errors.noLanguages'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
