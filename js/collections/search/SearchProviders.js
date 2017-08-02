import { Collection } from 'backbone';
import LocalStorageSync from '../../utils/backboneLocalStorage';
import Provider from '../../models/search/SearchProvider';

export default class extends Collection {
  model(attrs, options) {
    return new Provider(attrs, options);
  }

  localStorage() {
    return new LocalStorageSync('__searchProviders');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  /**
   * One of the providers should be marked as isDefault. If none are, use the first one.
   */
  get isDefaultProvider() {
    const isDefaultProvider = this.findWhere({ isDefault: true });
    return isDefaultProvider || this.at(0);
  }
}
