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

    if (!attrs.termsAndConditions) {
      addError('termsAndConditions', app.polyglot.t('settings.moderationTab.errors.noTerms'));
    }

    if (!attrs.languages.length) {
      addError('languages', app.polyglot.t('settings.moderationTab.errors.noLanguages'));
    }

    // todo: more validations -
    // - termsAndConditions max length
    // - descirpiont max length??
    // - are all lang codes provided valid codes based
    //   on our utils/languages module (which needs to
    //   be built up).
    // etc...

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
