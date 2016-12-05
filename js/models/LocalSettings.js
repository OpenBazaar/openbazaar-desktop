import electron from 'electron';
import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';
import is from 'is_js';

const remote = electron.remote;

export default class extends Model {
  localStorage() {
    return new LocalStorageSync('__localSettings');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    return {
      macStyleWinControls: remote.process.platform === 'darwin',
      language: 'en-US',
      listingsGridViewType: 'grid',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.boolean(attrs.macStyleWinControls)) {
      addError('macStyleWinControls', 'Please provide a boolean value.');
    }

    if (['list', 'grid'].indexOf(attrs.listingsGridViewType) === '-1') {
      addError('The listingsGridViewType provided is not one of the available types.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
