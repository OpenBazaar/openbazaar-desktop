import app from '../../app';
import is from 'is_js';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      title: '',
      logoUrl: '',
      searchUrl: '',
      torSearchUrl: '',
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

    if (is.not.string(attrs.title) || !attrs.title) {
      addError('title', app.polyglot.t('searchProviderModelErrors.title'));
    }

    const urls = ['logoUrl', 'searchUrl', 'torSearchUrl'];

    urls.forEach((url) => {
      if (is.not.string(attrs[url]) || !attrs[url] || is.not.url(attrs[url])) {
        addError(url, app.polyglot.t(`searchProviderModelErrors.${url}`));
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
