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

  validate(attrs, options) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };
    const urlType = options.urlType || 'listings';

    if (attrs.name && is.not.string(attrs.name)) {
      addError('name', app.polyglot.t('searchProviderModelErrors.invalidName'));
    }

    if (attrs.logo && is.not.url(attrs.logo)) {
      addError('logo', app.polyglot.t('searchProviderModelErrors.invalidLogo'));
    }

    // a provider is expected to be created with one url. The view should retrieve the other urls
    // on the first call to the endpoint.
    if (!attrs[urlType] || is.not.string(attrs[urlType]) || is.not.url(attrs[urlType])) {
      addError(urlType, app.polyglot.t(`searchProviderModelErrors.invalid${urlType}`));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
