import BaseModel from './BaseModel';
import LocalStorageSync from '../utils/backboneLocalStorage';
import is from 'is_js';

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
      port: 8080,
      SSL: false,
      default: false,
    };
  }

  needsAuthentication() {
    let needsAuth = false;

    if (!this.isLocalServer()) {
      needsAuth = true;
    } else {
      if (!this.get('default')) {
        if (this.get('username') || this.get('password')) {
          needsAuth = true;
        }
      }
    }

    return needsAuth;
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!is.existy(attrs.name) || is.empty(attrs.name)) {
      addError('name', 'Please provide a value.');
    } else {
      // Slight hack since backbone doesn't document Model.collection and
      // it will only refer to the first collection that a Model belongs.
      // http://stackoverflow.com/a/15962917/632806
      if (this.collection) {
        const models = this.collection.where({ name: attrs.name });
        if (models && models.length && (models.length > 1 || models[0].id !== attrs.id)) {
          addError('name', 'There is already a configuration with that name.');
        }
      }
    }

    if (!is.existy(attrs.serverIp) || is.empty(attrs.serverIp)) {
      addError('serverIp', 'Please provide a value.');
    } else {
      if (!is.ip(attrs.serverIp)) {
        addError('serverIp', 'This does not appear to be a valid IP address.');
      }
    }

    // TODO: remotes must provide credentials
    // TODO: enforce SSL on remotes

    if (!attrs.default) {
      if (!is.number(attrs.port)) {
        addError('port', 'Please provide a number.');
      } else {
        if (!is.within(attrs.port, -1, 65536)) {
          addError('port', 'Please provide a number between 0 and 65535.');
        }
      }

      // if (!is.existy(attrs.username) || is.empty(attrs.username)) {
      //   addError('username', 'Please provide a value.');
      // }

      // if (!is.existy(attrs.password) || is.empty(attrs.password)) {
      //   addError('password', 'Please provide a value.');
      // }
    } else {
      if (is.existy(attrs.port) && attrs.port !== this.defaults().port) {
        // For now, not allowing the port to be changed on the default server,
        // since there is currently no way to set the port as an option
        // on the command line, the local bundled server will always be started
        // with the default port.
        addError('port', `On the default server, the port can only be ${this.defaults().port}.`);
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

  isLocalServer() {
    const ip = this.get('server_ip');

    return ip === 'localhost' || ip === '127.0.0.1';
  }
}
