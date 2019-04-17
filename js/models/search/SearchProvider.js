import app from '../../app';
import is from 'is_js';
import LocalStorageSync from '../../utils/lib/backboneLocalStorage';
import { curConnOnTor } from '../../utils/serverConnect';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      logo: '',
      listings: '',
      torlistings: '',
      vendors: '',
      torvendors: '',
      reports: '',
      torreports: '',
    };
  }

  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  get tor() {
    return curConnOnTor() ? 'tor' : '';
  }

  get listingsUrl() {
    // Fall back to clear endpoint on tor if no tor endpoint exists.
    return this.get(`${this.tor}listings`) || this.get('listings');
  }

  get vendorsUrl() {
    // Fall back to clear endpoint on tor if no tor endpoint exists.
    return this.get(`${this.tor}vendors`) || this.get('vendors');
  }

  get reportsUrl() {
    // Fall back to clear endpoint on tor if no tor endpoint exists.
    return this.get(`${this.tor}reports`) || this.get('reports');
  }

  validate(attrs, options) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };
    const urlTypes = options.urlTypes ||
      ['listings', 'torlistings', 'vendors', 'torvendors', 'reports', 'torreports'];

    if (attrs.name && is.not.string(attrs.name)) {
      addError('name', app.polyglot.t('searchProviderModelErrors.invalidName'));
    }

    if (attrs.logo && is.not.url(attrs.logo)) {
      addError('logo', app.polyglot.t('searchProviderModelErrors.invalidLogo'));
    }

    // a provider can be created with less than all of the urls. The view is expected to retrieve
    // and save the missing urls when the search api is called
    urlTypes.forEach(urlType => {
      if (attrs[urlType] && is.not.url(attrs[urlType])) {
        addError(urlType, app.polyglot.t(`searchProviderModelErrors.invalid${urlType}`));
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
