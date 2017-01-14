import { remote } from 'electron';
import app from '../../../app';
import
  serverConnect,
  { getCurrentConnection, events as serverConnectEvents } from '../../../utils/serverConnect';
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

    this.listenTo(serverConnectEvents, 'disconnect', e => {
      const curConn = getCurrentConnection();

      // If we lost a connection, but another one is in progress,
      // we'll do nothing. Otherwise, we'll show a "lost connection"
      // state for the disconnected connection.
      if (!(curConn && curConn.socket !== e.socket)) {
        this.handleFailedConnection('disconnect', e);
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
    };
  }

  handleFailedConnection(eventName, e) {
    let links = `<a href="https://github.com/OpenBazaar/openbazaar-desktop/blob/server-connect-ui/docs/connectionIssues.md">${app.polyglot.t('connectionManagement.statusBar.needHelpLink')}</a>`;
    let msg = '';

    if (localServer) {
      links =
        '<a class="js-viewDebugLog">' +
        `${app.polyglot.t('connectionManagement.statusBar.viewLocalServerDebugLogLink')}` +
        `</a>&nbsp;|&nbsp;<a>${links}</a>`;
    }

    if (e.reason === 'authentication-failed') {
      msg = app.polyglot.t('connectionManagement.statusBar.errorAuthFailed', {
        serverName: e.server.get('name'),
        errorPreface: '<span class="txB">' +
          `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
        links,
      });
    } else if (e.reason === 'canceled') {
      this.$statusBarOuterWrap.addClass('hide');
      this.configViews.forEach(configVw => configVw.setState({ status: 'not-connected' }));
      return;
    } else if (eventName === 'disconnect') {
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

  onConfigConnectClick(e) {
    const serverConfig = this.collection.at(this.configViews.indexOf(e.view));
    serverConnect(serverConfig, {
      // Unlike the start-up sequence, the assumption is that at this point
      // any server is already up and running, so we'll only try to connect
      // once. If it fails, the user can retry.
      //
      // We'll also give a quite high attempt time before giving up to account
      // for edge case really slow servers / machines. The user will have the option
      // to cancel the attempt if it's taking longer than they think it should.
      attempts: 1,
      maxAttemptTime: 20 * 1000,
    });
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
