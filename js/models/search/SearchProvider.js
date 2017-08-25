import app from '../../app';
import is from 'is_js';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      logo: '',
      search: '', // currently not used, this searches vendors and listings
      listings: '',
      torsearch: '', // currently not used, this searches vendors and listings
      torlistings: '',
      locked: false,
      order: 999999999, // order new providers after the defaults
    };
  }

  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.name && is.not.string(attrs.name)) {
      addError('name', app.polyglot.t('searchProviderModelErrors.name'));
    }

    if (attrs.logo && is.not.url(attrs.logo)) {
      addError('name', app.polyglot.t('searchProviderModelErrors.logo'));
    }

    const urls = ['listings', 'torlistings'];
    const validUrls = [];

    urls.forEach((url) => {
      if (attrs[url] && is.string(attrs[url]) && is.url(attrs[url])) {
        validUrls.push(url);
      }
    });

    if (!validUrls.length) {
      addError('listings', app.polyglot.t('searchProviderModelErrors.listings'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
