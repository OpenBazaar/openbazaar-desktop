import { platform, homedir } from 'os';
import app from '../app';
import { Collection } from 'backbone';
import LocalStorageSync from '../utils/lib/backboneLocalStorage';
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

  get homedir() {
    if (!this._homedir) {
      this._homedir = homedir();
    }

    return this._homedir;
  }

  get walletCurrencyToDataDir() {
    return {
      BTC: {
        win32: `${this.homedir}/OpenBazaar2.0`,
        darwin: `${this.homedir}/Library/Application Support/OpenBazaar2.0`,
        linux: `${this.homedir}/.openbazaar2.0`,
      },
      BCH: {
        win32: `${this.homedir}/OpenBazaar2.0-bitcoincash`,
        darwin: `${this.homedir}/Library/Application Support/OpenBazaar2.0-bitcoincash`,
        linux: `${this.homedir}/.openbazaar2.0-bitcoincash`,
      },
      ZEC: {
        win32: `${this.homedir}/OpenBazaar2.0-zcash`,
        darwin: `${this.homedir}/Library/Application Support/OpenBazaar2.0-zcash`,
        linux: `${this.homedir}/.openbazaar2.0-zcash`,
      },
    };
  }

  migrate() {
    let builtInCount = 0;

    this.forEach(serverConfig => {
      // Migrate any old "built in" configurations containing the 'default' flag to
      // use the new 'builtIn' flag.
      const isDefault = serverConfig.get('default');

      if (typeof isDefault === 'boolean') {
        serverConfig.unset('default');
        const configSave = serverConfig.save({ builtIn: isDefault });

        if (!configSave) {
          // developer error or wonky data
          console.error('There was an error migrating the server config, ' +
            `${serverConfig.get('name')}, from the 'default' to the 'built-in' style.`);
        }
      }

      if (serverConfig.get('builtIn')) builtInCount++;

      // Migrate a walletCurrency to a dataDir.
      const walletCurrency = serverConfig.get('walletCurrency');

      if (walletCurrency) {
        serverConfig.unset('walletCurrency');

        if (typeof walletCurrency === 'string') {
          const walletCurPaths = this.walletCurrencyToDataDir[walletCurrency];

          if (walletCurPaths) {
            const dataDir = walletCurPaths[platform()];
            if (dataDir) {
              const configSave = serverConfig.save({ dataDir });

              if (!configSave) {
                // developer error or wonky data
                console.error('There was an error migrating the dataDir for server ' +
                  `config ${serverConfig.get('name')}.`);
              }
            }
          }
        }
      }
    });

    // If there is just one built-in server, we'll ensure it has the correct name. If there
    // are multiple, which means they are legazy ones for different walletCurrencies, we'll
    // leave them be so the name still includes the currency and the user could still distinguish
    // between the two.
    if (builtInCount === 1) {
      const builtIn = this.findWhere({ builtIn: true });
      const configSave = builtIn.save({
        name: app.polyglot.t('connectionManagement.builtInServerName'),
      });

      if (!configSave) {
        // developer error or wonky data
        console.error('There was an error updating the name for built-in server ' +
          `config ${builtIn.get('name')}.`);
      }
    }
  }
}
