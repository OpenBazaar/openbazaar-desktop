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

  get socialTypes() {
    return [
      'facebook',
      'twitter',
      'instagram',
      'other',
    ];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };


    // TODO TODO TODO
    // TODO TODO
    // TODO: move errors into their own namespace
    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', app.polyglot.t('profileModelErrors.provideValidEmail'));
    }

    if (attrs.website && is.not.url(attrs.website)) {
      addError('website', app.polyglot.t('profileModelErrors.provideValidURL'));
    }

    const socialAccounts = attrs.social;
    // used to give errors on dupes of the same type
    const groupedByType = socialAccounts.groupBy('type');

    // TODO TODO TODO: let's use cid here.
    socialAccounts.forEach((socialMd, index) => {
      const socialAttrs = socialMd.attributes;

      if (is.not.string(socialAttrs.username) || !socialAttrs.username.length) {
        addError(`social[${index}].username`, app.polyglot.t('profileModelErrors.provideUsername'));
      }

      if (is.not.string(socialAttrs.type)) {
        addError(`social[${index}].type`, 'Please provide a type.');
      } else if (this.socialTypes.indexOf(socialAttrs.type) === -1) {
        addError(`social[${index}].type`, 'Type must be one of the required types.');
      }

      // if there are dupes of the same type, give an error to all
      // dupes after the first one
      if (socialAttrs.type !== 'other' && groupedByType[socialAttrs.type].length > 1 &&
        groupedByType[socialAttrs.type].indexOf(socialMd) > 0) {
        addError(`social[${index}].type`,
          app.polyglot.t('profileModelErrors.duplicateSocialAccount'));
      }

      // todo: dont allow multiple others with the same username.
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
