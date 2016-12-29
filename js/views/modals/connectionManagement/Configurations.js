import app from '../../../app';
import
  serverConnect,
  { getCurrentConnection, events as serverConnectEvents } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Configuration from './Configuration';
import StatusBar from './StatusBar';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a server configurations collection.');
    }

    super(options);
    this.configViews = [];

    this.listenTo(serverConnectEvents, 'all', (eventName, eventData) => {
      console.log(`gotta ${eventName} event wit sum data`);
      window.data = eventData;
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

    this.listenTo(serverConnectEvents, 'connect-attempt-failed', e => {
      let msg = '';

      if (e.reason === 'authentication-failed') {
        msg = app.polyglot.t('connectionManagement.statusBar.errorAuthFailed', {
          serverName: e.server.get('name'),
          errorPreface: '<span class="txB">' +
            `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
          needHelpLink: `<a>${app.polyglot.t('connectionManagement.statusBar.needHelpLink')}</a>`,
        });
      } else if (e.reason === 'canceled') {
        this.$statusBarOuterWrap.addClass('hide');
        this.configViews.forEach(configVw => configVw.setState({ status: 'not-connected' }));
        return;
      } else { // generic unable to reach server
        msg = app.polyglot.t('connectionManagement.statusBar.errorUnableToReachServer', {
          serverName: e.server.get('name'),
          errorPreface: '<span class="txB">' +
            `${app.polyglot.t('connectionManagement.statusBar.errorPreface')}</span>`,
          needHelpLink: `<a>${app.polyglot.t('connectionManagement.statusBar.needHelpLink')}</a>`,
        });
      }

      this.statusBarMessage.setState({
        status: 'connect-attempt-failed',
        msg,
      });
      this.$statusBarOuterWrap.removeClass('hide');

      this.getConfigVw(e.server.id)
        .setState({ status: 'connect-attempt-failed' });
    });

    this.listenTo(serverConnectEvents, 'connected', e => {
      this.$statusBarOuterWrap.addClass('hide');
      this.getConfigVw(e.server.id)
        .setState({ status: 'connected' });
    });

    this.listenTo(this.collection, 'remove', (cl, md, opts) =>
      this.configViews[opts.index].remove());
  }

  className() {
    return 'configurations';
  }

  events() {
    return {
      'click .js-btnNew': 'onNewClick',
    };
  }

  onNewClick() {
    this.trigger('newClick');
  }

  onConfigConnectClick(e) {
    serverConnect(this.collection.at(this.configViews.indexOf(e.view)), { attempts: 2 });
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
    this.listenTo(configVw, 'delete', e => this.collection.remove(e.view.model));

    return configVw;
  }

  get $statusBarOuterWrap() {
    return this._$statusBarOuterWrap ||
      (this._$statusBarOuterWrap = this.$('.js-statusBarOuterWrap'));
  }

  render() {
    loadTemplate('modals/connectionManagement/configurations.html', (t) => {
      this.$el.html(t());

      this.configViews.forEach(configVw => configVw.remove());
      this.configViews = [];

      const configContainer = document.createDocumentFragment();
      this.collection.forEach(md => {
        const configVw = this.createConfigView({ model: md });
        this.configViews.push(configVw);
        configContainer.appendChild(configVw.render().el);
      });

      this.$('.js-serverConfigsContainer').html(configContainer);

      if (this.statusBarMessage) this.statusBarMessage.remove();
      this.statusBarMessage = this.createChild(StatusBar);
      this.listenTo(this.statusBarMessage, 'closeClick',
        () => this.$statusBarOuterWrap.addClass('hide'));
      this.$('.js-statusBarMessageContainer').append(this.statusBarMessage.render().el);

      this.listenTo(this.statusBarMessage, 'clickCancelLink', () => this.cancelConnAttempt());

      this._$statusBarOuterWrap = null;
    });

    return this;
  }
}
