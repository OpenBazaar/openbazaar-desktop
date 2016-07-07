import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';
import { isMac } from '../utils/platform';
import is from 'is_js';

export default class LocalSettings extends Model {
  localStorage() {
    return new LocalStorageSync('__localSettings');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    return {
      mac_style_win_controls: isMac(),
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.mac_style_win_controls && is.not.boolean(attrs.mac_style_win_controls)) {
      addError('mac_style_win_controls', 'Please provide a boolean value.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
