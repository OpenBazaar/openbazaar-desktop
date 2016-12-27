import electron from 'electron';
import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';

const remote = electron.remote;
const controlStyles = ['mac', 'win'];
const viewStyles = ['list', 'grid'];
const feeLevels = ['low', 'medium', 'high'];

export default class extends Model {
  localStorage() {
    return new LocalStorageSync('__localSettings');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    return {
      windowControlStyle: remote.process.platform === 'darwin' ? 'mac' : 'win',
      showAdvancedVisualEffects: true,
      saveTransactionMetadata: true,
      defaultTransactionFee: 'high',
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

    if (!controlStyles.includes(attrs.windowControlStyle)) {
      addError('windowControlStyle', `Please provide one of ${controlStyles}.`);
    }

    if (!viewStyles.includes(attrs.listingsGridViewType)) {
      addError(`ListingGrideViewType needs to be one of ${viewStyles}.`);
    }

    if (!feeLevels.includes(attrs.defaultTransactionFee)) {
      addError('defaultTransactionFee', `Default transaction fee needs to be one of ${feeLevels}.`);
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
