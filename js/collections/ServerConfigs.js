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
    this.on('sync', () => this.bindActiveServerChangeHandler());
  }

  /**
   * The "active" server is the server we are currently connected to or if we're not
   * connected to any server, it's the last server we were connected to. When the app is
   * re-started, a connection will automatically be attempted to this server.
   */
  get activeServer() {
    return this.get(this._activeId);
  }

  set activeServer(md) {
    if (!md instanceof ServerConfig) {
      throw new Error('Please provide a model as a ServerConfig instance.');
    }

    if (this.models.indexOf(md) === -1) {
      throw new Error('The provided model is not in this collection and must be to' +
        ' set it as the active config.');
    }

    if (!md.id) {
      throw new Error('The provided model must have an id in order to be set as the' +
        ' active config.');
    }

    if (this._active !== md.id) {
      this._activeId = md.id;
      localStorage.activeServerConfig = md.id;
      this.trigger('activeServerChange', md);
      this.bindActiveServerChangeHandler();
    }
  }

  onActiveServerChange(md) {
    this.trigger('activeServerChange', md);
  }

  bindActiveServerChangeHandler() {
    if (this.activeServer) {
      this.activeServer.off('change', this.onActiveServerChange)
        .on('change', this.onActiveServerChange);
    }
  }
}
