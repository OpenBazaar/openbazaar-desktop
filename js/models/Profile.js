import BaseModel from './BaseModel';
import app from '../app';
import is from 'is_js';
import SocialAccounts from '../collections/SocialAccounts';

export default class extends BaseModel {
  defaults() {
    return {
      primaryColor: '#086A9E',
      secondaryColor: '#317DB8',
      textColor: '#ffffff',
      social: [],
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  nested() {
    return {
      social: SocialAccounts,
    };
  }

  getColorFields() {
    return [
      'primaryColor',
      'secondaryColor',
      'textColor',
    ];
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

    const colorFields = this.getColorFields();

    colorFields.forEach((colorField) => {
      const clr = attrs[colorField];

      if (is.not.hexColor(clr)) {
        addError(colorField, app.polyglot.t('profileModelErrors.provideValidHexColor'));
      } else if (clr.charAt(0) !== '#') {
        addError(colorField, 'The color should start with a leading hash.');
      }
    });

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', app.polyglot.t('profileModelErrors.provideValidEmail'));
    }

    if (attrs.website && is.not.url(attrs.website)) {
      addError('website', app.polyglot.t('profileModelErrors.provideValidURL'));
    }

    if (attrs.handle && attrs.handle.charAt(0) === '@') {
      addError('handle', 'The handle should not start with a leading @.');
    }

    const socialAccounts = attrs.social;
    // used to give errors on dupes of the same type
    const groupedByType = socialAccounts.groupBy('type');

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

  // Ensure any colors are strings and have a leading hash.
  standardizeColorFields(attrs = {}) {
    const updatedAttrs = { ...attrs };

    this.getColorFields().forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = updatedAttrs[field].toString();
        updatedAttrs[field] = updatedAttrs[field].charAt(0) !== '#' ?
          `#${updatedAttrs[field]}` : updatedAttrs[field];
      }
    });

    return updatedAttrs;
  }

  parse(response) {
    return this.standardizeColorFields(response);
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    // ensure certain fields that shouldn't be updated don't go
    // to the server
    if (method !== 'read') {
      delete options.attrs.followerCount;
      delete options.attrs.followingCount;
      delete options.attrs.listingCount;
      delete options.attrs.lastModified;
    }

    if (method === 'read') {
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
