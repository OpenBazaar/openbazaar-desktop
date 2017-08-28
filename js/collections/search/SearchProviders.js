import { Collection } from 'backbone';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import Provider from '../../models/search/SearchProvider';

export default class extends Collection {
  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  constructor(models, options) {
    super(models, options);
    this._activeId = localStorage.activeProvider;
    this._activeTorId = localStorage.activeTorProvider;
    this._defaultId = this.localStorage.defaultProvider;
    this._defaultTorId = this.localStorage.defaultTorProvider;
  }

  model(attrs, options) {
    return new Provider(attrs, options);
  }

  comparator(provider) {
    return provider.get('order');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  get maxProviders() {
    return 8;
  }

  get activeProvider() {
    return this.get(this._activeId);
  }

  get activeTorProvider() {
    return this.get(this._activeTorId);
  }

  get defaultProvider() {
    return this.get(this._defaultId);
  }

  get defaultTorProvider() {
    return this.get(this._defaultTorId);
  }

  set activeProvider(md) {
    this.setProvider(md, 'active');
  }

  set activeTorProvider(md) {
    this.setProvider(md, 'active', true);
  }

  set defaultProvider(md) {
    this.setProvider(md, 'default');
  }

  set defaultTorProvider(md) {
    this.setProvider(md, 'default', true);
  }

  setProvider(md, type, tor = false) {
    const types = ['active', 'default'];
    if (!md instanceof Provider) {
      throw new Error('Please provide a model as a Provider instance.');
    }

    if (this.models.indexOf(md) === -1) {
      throw new Error('Only a model in the collection can be set as a provider.');
    }

    if (!type || types.indexOf(type) === -1) {
      throw new Error('You must provide a valid type.');
    }

    const idString = `_${type}${tor ? 'Tor' : ''}Id`;
    const storageString = `${type}${tor ? 'Tor' : ''}Provider`;

    if (this[idString] !== md.id) {
      this[idString] = md.id;
      localStorage[storageString] = md.id;
    }
  }
}
