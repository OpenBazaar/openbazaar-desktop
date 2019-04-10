import app from '../../app';
import is from 'is_js';
import LocalStorageSync from '../../utils/lib/backboneLocalStorage';
import { getCurrentConnection } from '../../utils/serverConnect';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      logo: '',
      listings: '',
      torlistings: '',
      vendors: '',
      torVendors: '',
      reports: '',
      torReports: '',
    };
  }

  get idAttribute() {
    return 'name';
  }

  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  get usingTor() {
    return app.serverConfig.tor && getCurrentConnection().server.get('useTor');
  }

  get listingsUrl() {
    return this.get(`${this.usingTor ? 'tor' : ''}listings`);
  }

  get vendorsUrl() {
    return this.get(`${this.usingTor ? 'tor' : ''}vendors`);
  }

  get reportsUrl() {
    return this.get(`${this.usingTor ? 'tor' : ''}reports`);
  }

  validate(attrs, options) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };
    const urlTypes = options.urlTypes || ['vendors', 'listings', 'torvendors', 'torlistings'];

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
