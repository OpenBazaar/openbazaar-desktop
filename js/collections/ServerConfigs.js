import { Collection } from 'backbone';
import LocalStorageSync from '../utils/backboneLocalStorage';
import ServerConfig from '../models/ServerConfig';

export default class extends Collection {
  localStorage() {
    return new LocalStorageSync('__serverConfigs');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  model(attrs, options) {
    return new ServerConfig(attrs, options);
  }

  constructor(models, options) {
    super(models, options);

    this._activeId = localStorage.activeServerConfig;

    this.on('update reset', (cl, opts = {}) => {
      if (opts.previousModels) {
        // its a reset
        if (this.length) {
          this.activeServer = this.at(0).id;
        } else {
          delete localStorage.activeServerConfig;
        }
      } else {
        // its an update
        if (!this.get(this.activeServer)) {
          if (this.length) {
            this.activeServer = this.at(0).id;
          } else {
            delete localStorage.activeServerConfig;
          }
        }
      }
    });
  }

  get activeServer() {
    return this.get(this._activeId);
  }

  set activeServer(id) {
    if (!this.get(id)) {
      throw new Error('Unable to set the active server config. It must be an id of one of the' +
          ' server configurations stored in this collection.');
    }

    if (this._active !== id) {
      this._activeId = id;
      localStorage.activeServerConfig = id;
      // this.trigger('activeServerChange', md);
    }
  }
}
