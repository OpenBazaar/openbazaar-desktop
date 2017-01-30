import BaseModel from '../BaseModel';
import app from '../../app';
import Fee from './Fee';

export default class extends BaseModel {
  defaults() {
    return {
      fee: new Fee(),
      description: '',
      termsAndConditions: '',
      languages: app.settings ? app.settings.get('language') : '',
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

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };
    const max = this.max;

    if (!attrs.description) {
      addError('description',
        app.polyglot.t('settings.moderationTab.moderatorModelErrors.noDescription'));
    }

    if (attrs.description.length > max.descriptionLength) {
      addError('description',
        app.polyglot.t('settings.moderationTab.moderatorModelErrors.descriptionLength'));
    }

    if (!attrs.termsAndConditions) {
      addError('termsAndConditions',
        app.polyglot.t('settings.moderationTab.moderatorModelErrors.noTerms'));
    }

    if (attrs.termsAndConditions.length > max.termsLength) {
      addError('termsAndConditions',
        app.polyglot.t('settings.moderationTab.moderatorModelErrors.termsLength'));
    }

    if (!attrs.languages.length) {
      addError('languages',
        app.polyglot.t('settings.moderationTab.moderatorModelErrors.noLanguages'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
