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

  /**
   * If the provider needs to be reset, this returns the 1st model from the hard coded providers
   */
  get originalProvider() {
    return this.at(0);
  }

  set defaultProvider(md) {
    if (!md instanceof Provider) {
      throw new Error('Please provide a model as a SearchProvider instance.');
    }

    if (this.models.indexOf(md) === -1) {
      throw new Error('The provider model to set to default must be in this collection.');
    }

    if (md !== this.defaultProvider) {
      this.defaultProvider.set('isDefault', false);
      md.set('isDefault', true);
    }
  }
}
