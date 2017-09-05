import { Collection } from 'backbone';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import Provider from '../../models/search/SearchProvider';

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

  get defaultProvider() {
    return this.get(this._defaultId);
  }

  get defaultTorProvider() {
    return this.get(this._defaultTorId);
  }

  set defaultProvider(md) {
    this.setProvider(md);
  }

  set defaultTorProvider(md) {
    this.setProvider(md, true);
  }

  setProvider(md, tor = false) {
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
