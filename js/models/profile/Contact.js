import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';
import SocialAccounts from '../../collections/profile/SocialAccounts';

export default class extends BaseModel {
  defaults() {
    return {
      website: '',
      email: '',
      phoneNumber: '',
      social: new SocialAccounts(),
    };
  }

  get nested() {
    return {
      social: SocialAccounts,
    };
  }

  get maxSocialAccounts() {
    return 30;
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };


    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', app.polyglot.t('contactModelErrors.provideValidEmail'));
    }

    if (attrs.website && is.not.url(attrs.website)) {
      addError('website', app.polyglot.t('contactModelErrors.provideValidURL'));
    }

    if (attrs.social.length > this.maxSocialAccounts) {
      addError('socialAccounts',
        app.polyglot.t('contactModelErrors.tooManySocialAccounts',
          { max: this.maxSocialAccounts }));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
