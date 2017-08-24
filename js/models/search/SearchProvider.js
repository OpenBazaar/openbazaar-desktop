import app from '../../app';
import is from 'is_js';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      logoUrl: '',
      allUrl: '', // currently not used, this searches vendors and listings
      listingsUrl: '',
      torAllUrl: '', // currently not used, this searches vendors and listings
      torListingsUrl: '',
      isDefault: false,
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

    if (attrs.logoUrl && is.not.url(attrs.logoUrl)) {
      addError('name', app.polyglot.t('searchProviderModelErrors.logoUrl'));
    }

    const urls = ['listingsUrl', 'torListingsUrl'];
    const noValidUrls = [];

    urls.forEach((url) => {
      if (attrs[url] && is.string(attrs[url]) && is.url(attrs[url])) {
        noValidUrls.push(url);
      }
    });

    if (noValidUrls.length === urls.length) {
      addError('listingsUrl', app.polyglot.t('searchProviderModelErrors.listingsUrl'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
