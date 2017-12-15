import { remote } from 'electron';
import LocalStorageSync from '../utils/backboneLocalStorage';
import { Model } from 'backbone';
import is from 'is_js';
import { feeLevels } from '../utils/fees';
import { getTranslationLangByCode } from '../data/languages';
import app from '../app';

/**
 * Will convert a transifex style language tag to the standard format JS understands as
 * best as it can. For example, `ca_ES` will be returned as  `ca-ES` and `ca@valencia` will
 * be returned as `ca`. It's still probably a good idea to wrap any JS that deals with these
 * codes in a try/catch (e.g. localeCompare) since even a standardized transifex code may not
 * map to something JS understands.
 */
export function standardizedTranslatedLang(lang) {
  if (!lang || (typeof lang !== 'string')) {
    throw new Error('Please provide a language as a string.');
  }

  return lang.replace('_', '-')
    .slice(0, lang.indexOf('@') > -1 ? lang.indexOf('@') : lang.length);
}

export default class extends Model {
  localStorage() {
    return new LocalStorageSync('__localSettings');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    let langDataObj;

    try {
      langDataObj = getTranslationLangByCode(navigator.language.replace('-', '_'));
    } catch (e) {
      // pass
    }

    const language = langDataObj && langDataObj.code || 'en_US';

    return {
      windowControlStyle: remote.process.platform === 'darwin' ? 'mac' : 'win',
      showAdvancedVisualEffects: true,
      saveTransactionMetadata: true,
      defaultTransactionFee: 'NORMAL',
      language,
      listingsGridViewType: 'grid',
      bitcoinUnit: 'BTC',
      verifiedModsProvider: 'https://search.ob1.io/trusted_moderators',
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


  standardizedTranslatedLang() {
    return standardizedTranslatedLang(this.get('language'));
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

    if (is.not.url(attrs.verifiedModsProvider)) {
      addError('verifiedModsProvider',
        app.polyglot.t('localSettingsModelErrors.verifiedModsProvider'));
    }

    if (typeof attrs.dontShowTorExternalLinkWarning !== 'boolean') {
      addError('dontShowTorExternalLinkWarning',
        'dontShowTorExternalLinkWarning must be provided as a boolean.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
