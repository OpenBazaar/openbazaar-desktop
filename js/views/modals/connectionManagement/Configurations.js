import { remote } from 'electron';
import app from '../../../app';
import
  serverConnect,
  {
    getCurrentConnection,
    events as serverConnectEvents,
    disconnect as serverDisconnect,
  } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Configuration from './Configuration';
import StatusBar from './StatusBar';
import { launchDebugLogModal } from '../../../utils/modalManager';

const localServer = remote.getGlobal('localServer');

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a server configurations collection.');
    }

    super(options);
    this.configViews = [];
    this.emptyConfigs = !!this.collection.length;
    this.pendingDisconnectServerId = null;

    this.listenTo(this.collection, 'update', cl => {
      const prevEmptyConfigs = this.emptyConfigs;
      this.emptyConfigs = !!cl.length;

      if (this.emptyConfigs !== prevEmptyConfigs) {
        this.render();
      }
    });

    this.listenTo(serverConnectEvents, 'connecting', e => {
      this.statusBarMessage.setState({
        status: 'connecting',
        msg: app.polyglot.t('connectionManagement.statusBar.connectAttemptMsg', {
          serverName: e.server.get('name'),
          cancelConnAttempt: '<a class="js-cancelLink">' +
            `${app.polyglot.t('connectionManagement.statusBar.cancelConnAttempt')}</a>`,
        }),
      });

      this.configViews.forEach(configVw => {
        if (configVw.model.id === e.server.id) {
          configVw.setState({ status: 'connecting' });
        } else {
          configVw.setState({ status: 'not-connected' });
        }
      });
    });

    this.listenTo(serverConnectEvents, 'disconnected', e => {
      const curConn = getCurrentConnection();

      // If the disconnect was at the users request (ie.
      // they pressed the Disconnect button), we'll just
      // change the button state.
      if (this.pendingDisconnectServerId === e.server.id) {
        this.pendingDisconnectServerId = null;
        let disconnectedServer =
          this.configViews.filter(vw => vw.model.id === e.server.id);
        disconnectedServer = disconnectedServer && disconnectedServer[0];
        if (disconnectedServer) disconnectedServer.setState({ status: 'not-connected' });
        return;
      }

      this.pendingDisconnectServerId = null;

      // If the disconnect is from a removed configuration (e.g. the user
      // deleted the config), we'll do nothing.
      if (!app.serverConfigs.get(e.server.id)) return;

      // If we lost a connection, but another one is in progress,
      // we'll do nothing. Otherwise, we'll show a "lost connection"
      // state for the disconnected connection.
      if (!(curConn && curConn.socket !== e.socket)) {
        this.handleFailedConnection('disconnected', e);
      }
    });

    this.listenTo(serverConnectEvents, 'connect-attempt-failed',
      e => this.handleFailedConnection('connect-attempt-failed', e));

    this.listenTo(serverConnectEvents, 'connected', e => {
      this.$statusBarOuterWrap.addClass('hide');
      this.getConfigVw(e.server.id)
        .setState({ status: 'connected' });
    });

    this.listenTo(this.collection, 'remove', (cl, md, opts) => {
      this.configViews[opts.index].remove();
      delete this.configViews[opts.index];
    });

    this.listenTo(this.collection, 'add', (md) => {
      const configVw = this.createConfigView({ model: md });
      this.configViews.push(configVw);
      this.$serverConfigsContainer.append(configVw.render().el);
    });
  }

  className() {
    return 'configurations';
  }

  events() {
    return {
      'click .js-btnNew': 'onNewClick',
      'click .js-editDefaultConfig': 'onClickEditDefaultConfig',
    };
  }

  handleFailedConnection(eventName, e) {
    let links = `<a href="https://github.com/OpenBazaar/openbazaar-desktop/blob/master/docs/connectionIssues.md">${app.polyglot.t('connectionManagement.statusBar.needHelpLink')}</a>`;
    let msg = '';

    if (localServer) {
      links =
        '<a class="js-viewDebugLog">' +
        `${app.polyglot.t('connectionManagement.statusBar.viewLocalServerDebugLogLink')}` +
        `</a>&nbsp;|&nbsp;<a>${links}</a>`;
    }

    if (e.reason === 'authentication-failed') {
      if (e.server.get('default')) {
        // If the default server fails with an auth issue, it's because the cookie token is
        // invalid. This should never happen and must be a dev error.
        msg = app.polyglot.t('connectionManagement.statusBar.errorAuthFailedBuiltInServer', {
          serverName: e.server.get('name'),
          errorPreface: '<span class="txB">' +
            `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
          links,
        });
      } else {
        msg = app.polyglot.t('connectionManagement.statusBar.errorAuthFailed', {
          serverName: e.server.get('name'),
          errorPreface: '<span class="txB">' +
            `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
          links,
        });
      }
    } else if (e.reason === 'canceled') {
      this.$statusBarOuterWrap.addClass('hide');
      this.configViews.forEach(configVw => configVw.setState({ status: 'not-connected' }));
      return;
    } else if (e.reason === 'tor-not-configured') {
      msg = app.polyglot.t('connectionManagement.statusBar.errorTorNotConfigured', {
        serverName: e.server.get('name'),
        editLink: '<a class="js-editDefaultConfig">' +
          `${app.polyglot.t('connectionManagement.statusBar.editLink')}</a>`,
        links,
      });

      if (!this.$el.is(':visible')) {
        // If the connection modal is not open, we'll open up the configuration form. The modal
        // will be opened shortly upon the connection failure. If the user already had the modal
        // open, we won't auto send them to the config form, since it may interrupt something else
        // they may be doing.
        this.trigger('editConfig', {
          model: this.collection.activeServer,
        });
      }
    } else if (e.reason === 'tor-not-available') {
      msg = app.polyglot.t('connectionManagement.statusBar.errorTorNotAvailable', {
        serverName: e.server.get('name'),
        editLink: '<a class="js-editDefaultConfig">' +
          `${app.polyglot.t('connectionManagement.statusBar.editLink')}</a>`,
        links,
      });

      if (!this.$el.is(':visible')) {
        // If the connection modal is not open, we'll open up the configuration form. The modal
        // will be opened shortly upon the connection failure. If the user already had the modal
        // open, we won't auto send them to the config form, since it may interrupt something else
        // they may be doing.
        this.trigger('editConfig', {
          model: this.collection.activeServer,
        });
      }
    } else if (eventName === 'disconnected') {
      msg = app.polyglot.t('connectionManagement.statusBar.errorConnectionLost', {
        serverName: e.server.get('name'),
        errorPreface: '<span class="txB">' +
          `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
        links,
      });
    } else { // generic unable to reach server
      msg = app.polyglot.t('connectionManagement.statusBar.errorUnableToReachServer', {
        serverName: e.server.get('name'),
        errorPreface: '<span class="txB">' +
          `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
        links,
      });
    }

    this.statusBarMessage.setState({
      status: 'connect-attempt-failed',
      msg,
    });
    this.$statusBarOuterWrap.removeClass('hide');

    this.getConfigVw(e.server.id)
      .setState({ status: 'connect-attempt-failed' });
  }

  onNewClick() {
    this.trigger('newClick');
  }

  onClickEditDefaultConfig() {
    this.trigger('editConfig', {
      model: this.collection.defaultConfig,
    });
  }

  onConfigConnectClick(e) {
    const serverConfig = this.collection.at(this.configViews.indexOf(e.view));
    serverConnect(serverConfig);
  }

  onConfigDisconnectClick(e) {
    serverDisconnect();
    this.pendingDisconnectServerId = e.view.model.id;
  }

  getConfigVw(id) {
    return this.configViews.filter(configVw => configVw.model.id === id)[0];
  }

  cancelConnAttempt() {
    const curConn = getCurrentConnection();

    if (curConn && curConn.cancel) curConn.cancel();
  }

  createConfigView(options = {}) {
    const opts = {
      ...options,
    };

    if (!opts.model) {
      throw new Error('Please provide a server config model in the options.');
    }

    const curConn = getCurrentConnection();

    if (curConn && curConn.server.id === opts.model.id) {
      opts.initialState = {
        status: curConn.status,
        ...opts.initialState,
      };
    }

    const configVw = this.createChild(Configuration, opts);
    this.listenTo(configVw, 'connectClick', this.onConfigConnectClick);
    this.listenTo(configVw, 'disconnectClick', this.onConfigDisconnectClick);
    this.listenTo(configVw, 'cancelClick', () => this.cancelConnAttempt());
    this.listenTo(configVw, 'editClick', e => this.trigger('editConfig', { model: e.view.model }));

    return configVw;
  }

  get $statusBarOuterWrap() {
    return this._$statusBarOuterWrap ||
      (this._$statusBarOuterWrap = this.$('.js-statusBarOuterWrap'));
  }

  render() {
    loadTemplate('modals/connectionManagement/configurations.html', (t) => {
      this.$el.html(t({
        configurations: this.collection.toJSON(),
      }));

      this.$serverConfigsContainer = this.$('.js-serverConfigsContainer');
      this._$statusBarOuterWrap = null;

      this.configViews.forEach(configVw => configVw.remove());
      this.configViews = [];

      const configContainer = document.createDocumentFragment();
      this.collection.forEach(md => {
        const configVw = this.createConfigView({ model: md });
        this.configViews.push(configVw);
        configContainer.appendChild(configVw.render().el);
      });

      this.$serverConfigsContainer.html(configContainer);

      if (this.statusBarMessage) this.statusBarMessage.remove();
      this.statusBarMessage = this.createChild(StatusBar);
      this.listenTo(this.statusBarMessage, 'closeClick',
        () => this.$statusBarOuterWrap.addClass('hide'));
      this.listenTo(this.statusBarMessage, 'clickViewDebugLog',
        () => launchDebugLogModal());
      this.listenTo(this.statusBarMessage, 'clickCancelLink', () => this.cancelConnAttempt());
      this.$('.js-statusBarMessageContainer').append(this.statusBarMessage.render().el);
    });

    return this;
  }
}
