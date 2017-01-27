import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';
import SocialAccounts from '../../collections/SocialAccounts';
import Image from './Image';
import Moderator from './Moderator';

export default class extends BaseModel {
  defaults() {
    return {
      about: '',
      email: '',
      handle: '',
      location: '',
      moderator: false,
      name: `ob ${Math.random().toString(36).slice(2)}`,
      nsfw: false,
      phoneNumber: '',
      primaryColor: '#FFFFFF',
      secondaryColor: '#ECEEF2',
      textColor: '#252525',
      highlightColor: '#2BAD23',
      highlightTextColor: '#FFFFFF',
      shortDescription: '',
      social: new SocialAccounts(),
      avatarHashes: new Image(),
      headerHashes: new Image(),
      vendor: false,
      website: '',
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  get nested() {
    return {
      social: SocialAccounts,
      avatarHashes: Image,
      headerHashes: Image,
      modInfo: Moderator,
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

  get isModerator() {
    return this.get('moderator') &&
      !!this.get('modInfo');
  }

  get max() {
    return {
      locationLength: 100,
    };
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
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

    if (!attrs.name) {
      addError('name', app.polyglot.t('profileModelErrors.provideName'));
    }

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', app.polyglot.t('profileModelErrors.provideValidEmail'));
    }

    if (attrs.handle && attrs.handle.charAt(0) === '@') {
      addError('handle', 'The handle should not start with a leading @.');
    }

    if (attrs.location && attrs.location.length > this.max.locationLength) {
      addError('location', app.polyglot.t('profileModelErrors.locationTooLong'));
    }

    if (attrs.website && is.not.url(attrs.website)) {
      addError('website', app.polyglot.t('profileModelErrors.provideValidURL'));
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
      if (app.profile.id === model.id) {
        options.url = app.getServerUrl('ob/profile');
      } else {
        options.url = app.getServerUrl(`ipns/${model.id}/profile`);
      }
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
