import { Collection } from 'backbone';
import is from 'is_js';
import Provider from '../../models/search/SearchProvider';
import LocalStorageSync from '../../utils/lib/backboneLocalStorage';
import { curConnOnTor } from '../../utils/serverConnect';

/**
 * Returns the URL minus any query parameters.
 * @param {string} url - A URL.
 * @returns {string} - The URL domain and pathname without any trailing slashes.
 */
function baseUrl(url) {
  if (!url || is.not.url(url)) throw new Error('Please provide a valid URL.');

  const tempUrl = new URL(url);
  return (`${tempUrl.host}${tempUrl.pathname}`).replace(/\/$/, '');
}

export default class extends Collection {
  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  constructor(models, options) {
    super(models, options);
    this._defaultId = localStorage.defaultProvider;
    this._defaultTorId = localStorage.defaultTorProvider;
  }

  model(attrs, options) {
    return new Provider(attrs, options);
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  get maxProviders() {
    return 8;
  }

  get tor() {
    return curConnOnTor() ? 'Tor' : '';
  }

  get defaultProvider() {
    // Fall back to the clearnet endpoint if no Tor endpoint exists.
    return this.get(this[`_default${this.tor}Id`]) || this.get(this._defaultId);
  }

  set defaultProvider(md) {
    this.setDefaultProvider(md);
  }

  set defaultTorProvider(md) {
    this.setDefaultProvider(md, true);
  }

  /**
   * This will retrieve the first provider that has the given URL for one of its endpoints.
   * @param {string} url - The endpoint URL being looked for.
   * @returns {object} - A search provider model.
   */
  getProviderByURL(url) {
    if (!url || is.not.url(url)) throw new Error('Please provide a valid URL.');

    return this.models.find(md => {
      let match = false;
      ['listings', 'torListings', 'vendors', 'torVendors'].forEach(type => {
        const typeUrl = md.get(type) && baseUrl(md.get(type));
        if (typeUrl && baseUrl(url) === typeUrl) match = true;
      });

      return match;
    });
  }

  /**
   * This will set the default provider for clear or Tor mode.
   * @param {object} md - A provider model.
   * @param {boolean} tor - Whether to save the default for clear or Tor mode.
   */
  setDefaultProvider(md, tor = false) {
    if (!md instanceof Provider) {
      throw new Error('Please provide a model as a Provider instance.');
    }

    if (this.models.indexOf(md) === -1) {
      throw new Error('Only a model in the collection can be set as a provider.');
    }

    const idString = `_default${tor ? 'Tor' : ''}Id`;
    const storageString = `default${tor ? 'Tor' : ''}Provider`;

    if (this[idString] !== md.id) {
      this[idString] = md.id;
      localStorage[storageString] = md.id;
    }
  }
}
