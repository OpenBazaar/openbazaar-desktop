/**
 * This differs from the Config model. This is a representation of a connection to the
 * server and is stored in local storage. Whereas, Config contains the configuartion provided
 * from the server via the ob/config api.
 */

import { remote } from 'electron';
import { platform } from 'os';
import LocalStorageSync from '../utils/lib/backboneLocalStorage';
import is from 'is_js';
import app from '../app';
import BaseModel from './BaseModel';

export default class extends BaseModel {
  localStorage() {
    return new LocalStorageSync('__serverConfigs');
  }

  sync(...args) {
    return LocalStorageSync.sync.apply(this, args);
  }

  defaults() {
    return {
      serverIp: 'localhost',
      port: 4002,
      SSL: false,
      builtIn: false,
      useTor: false,
      confirmedTor: false,
      torProxy: '127.0.0.1:9150',
      dontShowTorExternalLinkWarning: false,
      dismissedDiscoverCallout: false,
      dismissedStoreWelcome: false,
      backupWalletWarned: false,
      torPw: '',
      lastBlockchainResync: {},
    };
  }

  get walletCurrencyToDataDir() {
    return {
      BTC: {
        win32: '/OpenBazaar2.0',
        darwin: '/Library/Application Support/OpenBazaar2.0',
        linux: '/.openbazaar2.0',
      },
      BCH: {
        win32: '/OpenBazaar2.0-bitcoincash',
        darwin: '/Library/Application Support/OpenBazaar2.0-bitcoincash',
        linux: '/.openbazaar2.0-bitcoincash',
      },
      ZEC: {
        win32: '/OpenBazaar2.0-zcash',
        darwin: '/Library/Application Support/OpenBazaar2.0-zcash',
        linux: '/.openbazaar2.0-zcash',
      },
    };
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    const fullAttrs = {
      ...this.toJSON(),
      ...attrs,
    };

    if (fullAttrs.builtIn) {
      if (fullAttrs.walletCurrency) {
        attrs.name = attrs.name ||
          app.polyglot.t('connectionManagement.builtInServerNameWithCur',
            { cur: fullAttrs.walletCurrency });
      } else {
        attrs.name = app.polyglot.t('connectionManagement.builtInServerName');
      }
    }

    return super.set(attrs, opts);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!is.existy(attrs.name) || is.empty(attrs.name)) {
      addError('name', app.polyglot.t('serverConfigModelErrors.provideValue'));
    }

    if (!is.existy(attrs.serverIp) || is.empty(attrs.serverIp)) {
      addError('serverIp', app.polyglot.t('serverConfigModelErrors.provideValue'));
    } else {
      if (!is.ip(attrs.serverIp)) {
        addError('serverIp', app.polyglot.t('serverConfigModelErrors.invalidIp'));
      }
    }

    if (!this.isLocalServer()) {
      if (!attrs.username) {
        addError('username', app.polyglot.t('serverConfigModelErrors.provideValue'));
      }

      if (!attrs.password) {
        addError('password', app.polyglot.t('serverConfigModelErrors.provideValue'));
      }
    }

    if (attrs.useTor) {
      if (!attrs.torProxy) {
        addError('torProxy', app.polyglot.t('serverConfigModelErrors.provideValue'));
      } else if (typeof attrs.torProxy !== 'string') {
        addError('torProxy', 'Please provide the tor proxy configuration as a string.');
      } else {
        let valid = true;
        const split = attrs.torProxy.split(':');

        if (split.length !== 2) {
          valid = false;
        } else {
          if (!is.ip(split[0])) {
            valid = false;
          } else if (!is.within(parseInt(split[1], 10), -1, 65536)) {
            valid = false;
          }
        }

        if (!valid) {
          addError('torProxy', app.polyglot.t('serverConfigModelErrors.invalidTorProxy'));
        }
      }

      if (!attrs.torPassword && this.isTorPwRequired()) {
        addError('torPassword', app.polyglot.t('serverConfigModelErrors.provideValue'));
      }
    }

    if (!attrs.builtIn) {
      if (attrs.port === undefined || attrs.port === '') {
        addError('port', app.polyglot.t('serverConfigModelErrors.provideValue'));
      } else if (!is.number(attrs.port)) {
        addError('port', app.polyglot.t('serverConfigModelErrors.providePortAsNumber'));
      } else if (!is.within(attrs.port, -1, 65536)) {
        addError('port', app.polyglot.t('serverConfigModelErrors.provideValidPortRange'));
      }
    } else {
      if (is.existy(attrs.port) && attrs.port !== this.defaults().port) {
        // For now, not allowing the port to be changed on built in servers,
        // since there is currently no way to set the port as an option
        // on the command line, the local bundled server will always be started
        // with the default port.
        addError('port', `On a built-in server, the port can only be ${this.defaults().port}.`);
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  get httpUrl() {
    const prefix = this.get('SSL') ? 'https' : 'http';
    return `${prefix}://${this.get('serverIp')}:${this.get('port')}/`;
  }


  get socketUrl() {
    const prefix = this.get('SSL') ? 'wss' : 'ws';
    return `${prefix}://${this.get('serverIp')}:${this.get('port')}/ws`;
  }

  /**
   * Indicates if we need to authenticate when connecting to this server.
   */
  needsAuthentication() {
    let needsAuth = false;

    if (!this.isLocalServer()) {
      needsAuth = true;
    } else {
      if (this.get('username') || this.get('password')) {
        needsAuth = true;
      }
    }

    return needsAuth;
  }

  /**
   * Based on the ip, indicates whether this is a server running locally on
   * your machine. It may be the local bundled server or it may be a locally
   * run stand-alone server.
   */
  isLocalServer(ip = this.get('serverIp')) {
    return ip === 'localhost' || ip === '127.0.0.1';
  }

  isTorPwRequired() {
    return ['win', 'darwin'].indexOf(remote.process.platform) > -1 &&
      this.isLocalServer() && remote.getGlobal('isBundledApp');
  }

  parse(response) {
    if (
      response.builtIn &&
      response.walletCurrency &&
      !response.dataDir
    ) {
      const walletCurPaths = this.walletCurrencyToDataDir[response.walletCurrency];

      if (walletCurPaths) {
        const dataDir = walletCurPaths[platform()];
        if (dataDir) response.dataDir = dataDir;
      }
    }

    return response;
  }
}
