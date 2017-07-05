import { Collection, Model } from 'backbone';
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
   * The "default" config is the configuration that is associated with the built-in
   * server in the bundled app.
   */
  get defaultConfig() {
    return this.findWhere({ default: true });
  }

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

  set(models = [], options = {}) {
    // Not sure why if I create a model via Collection.Create, a single model
    // is being passed into this method, instead of an array. The documentation
    // does not reflect this.
    const modelsList = models instanceof Model ? [models] : models;

    const defaultConfig = this.defaultConfig;
    let defaultCount = this.defaultConfig ? 1 : 0;

    // ensure we are not trying to set more than one default config
    if (defaultConfig) {
      modelsList.forEach(model => {
        const jsonModel = model instanceof Model ?
          model.toJSON() : model;
        const defaultConfigId = this.defaultConfig ? this.defaultConfig.id : '';

        if (jsonModel.default &&
          (!options.merge || !jsonModel.id || jsonModel.id !== defaultConfigId)) {
          defaultCount += 1;
        }
      });
    }

    if (defaultCount > 1) {
      throw new Error('The collection already has a default model and you' +
        ' are attempting to add another one. Only one default model is allowed.');
    }

    super.set(models, options);
  }
}
