import { remote } from 'electron';
import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';
import is from 'is_js';
import { feeLevels } from '../utils/fees';
import app from '../app';

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
      defaultTransactionFee: 'PRIORITY',
      language: 'en-US',
      listingsGridViewType: 'grid',
      bitcoinUnit: 'BTC',
      searchProvider: 'https://search.ob1.io/search/listings',
      dontShowTorExternalLinkWarning: false,
    };
  }

  get controlStyles() {
    return ['mac', 'win'];
  }

  get viewStyles() {
    return ['list', 'grid'];
  }

  get bitcoinUnits() {
    return ['BTC', 'MBTC', 'UBTC', 'SATOSHI'];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!this.controlStyles.includes(attrs.windowControlStyle)) {
      addError('windowControlStyle', `Please provide one of ${this.controlStyles}.`);
    }

    if (!this.viewStyles.includes(attrs.listingsGridViewType)) {
      addError(`ListingGrideViewType needs to be one of ${this.viewStyles}.`);
    }

    if (!feeLevels.includes(attrs.defaultTransactionFee)) {
      addError('defaultTransactionFee', `The fee level must be one of ${feeLevels.join(', ')}`);
    }

    if (!this.bitcoinUnits.includes(attrs.bitcoinUnit)) {
      addError(`bitcoinUnit needs to be one of ${this.bitcoinUnits}.`);
    }

    if (is.not.url(attrs.searchProvider)) {
      addError('searchProvider', app.polyglot.t('localSettingsModelErrors.searchProvider'));
    }

    if (typeof attrs.dontShowTorExternalLinkWarning !== 'boolean') {
      addError('dontShowTorExternalLinkWarning',
        'dontShowTorExternalLinkWarning must be provided as a boolean.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
