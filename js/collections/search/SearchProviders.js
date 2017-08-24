import { Collection } from 'backbone';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import Provider from '../../models/search/SearchProvider';

export default class extends Collection {
  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  constructor(models, options) {
    super(models, options);
    this._activeId = localStorage.activeSearchProvider;
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

  /**
   * One of the providers should be marked as isDefault. If none are, use the first one.
   */
  get defaultProvider() {
    const defaultProvider = this.findWhere({ isDefault: true });
    return defaultProvider || this.at(0);
  }
}
