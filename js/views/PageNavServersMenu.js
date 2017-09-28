import $ from 'jquery';
import _ from 'underscore';
import app from '../app';
import serverConnect,
  { events as serverConnectEvents, getCurrentConnection } from '../utils/serverConnect';
import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a server configurations collection.');
    }

    super(options);

    let connectedServer = getCurrentConnection();

    if (connectedServer && connectedServer.status !== 'disconnected') {
      connectedServer = connectedServer.server.id;
    } else {
      connectedServer = null;
    }

    this._state = {
      connectedServer,
      ...options.initialState || {},
    };

    this.listenTo(this.collection, 'update', this.render);

    this.listenTo(serverConnectEvents, 'disconnected',
      () => this.setState({
        connectedServer: null,
      }));

    this.listenTo(serverConnectEvents, 'connected',
      e => this.setState({
        connectedServer: e.server.id,
      }));
  }

  className() {
    return 'listBox clrBr clrP clrSh1';
  }

  events() {
    return {
      'click .js-serverListItem': 'onServerClick',
      'click .js-newServer': 'onNewServerClick',
      'click .js-manageServers': 'onManageServersClick',
    };
  }

  onServerClick(e) {
    const serverId = $(e.target)
      .closest('.js-serverListItem')
      .data('server-id');

    const server = this.collection.get(serverId);

    serverConnect(server);
    app.connectionManagmentModal.open();
  }

  onNewServerClick() {
    app.connectionManagmentModal.selectTab('ConfigForm');
    app.connectionManagmentModal.open();
  }

  onManageServersClick() {
    app.connectionManagmentModal.open();
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('pageNavServersMenu.html', (t) => {
      this.$el.html(t({
        servers: this.collection.toJSON(),
        ...this._state,
      }));
    });

    return this;
  }
}
