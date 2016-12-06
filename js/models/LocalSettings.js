import electron from 'electron';
import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';
import is from 'is_js';

const remote = electron.remote;
const controlStyles = [ "mac", "win" ];
const viewStyles = [ "list", "grid" ];

export default class extends Model {
  localStorage() {
    return new LocalStorageSync('__localSettings');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    return {
      windowControlStyle: remote.process.platform === "darwin" ? "mac" : "win",
      showAdvancedVisualEffects : true,
      saveTransactionMetadata : true,
      defaultTransactionFee : 'high',
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

    if (!controlStyles.includes( attrs.windowControlyStyle ) ) {
      addError('windowControlStyle', 'Please provide a boolean value.');
    }

    if (!viewStyles.includes(attrs.listingsGridViewType)) {
      addError('The listingsGridViewType provided is not one of the available types.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
