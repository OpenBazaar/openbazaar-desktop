import { Events } from 'backbone';

/**
 * Class that wraps the standard WebSocket class allowing us to add in
 * some "sugar", which, as of now, consists mainly of extending from
 * Backbone.Events which gives us a more modern event framework.
 */
export default class extends Events {
  /**
   * Construct a new socket instance.
   * @constructor
   * @param {string} url - The websocket url.
   */
  constructor(url) {
    if (!url) {
      throw new Error('Please provide an url.');
    }

    this.url = url;
    this.connect();
  }

  /**
   * Connect your websocket. This is automatically called in the
   * constructor, so for all practical purposes the only time you
   * will directly call this is if your connection was lost and
   * you want to reconnect to the same url.
   */
  connect() {
    if (this._socket && this._socket.readyState < 2) return;

    if (this._socket) {
      this._socket.onopen = null;
      this._socket.onclose = null;
      this._socket.onerror = null;
      this._socket.onmessage = null;
    }

    this._socket = new WebSocket(this.url);
    this._proxyEvent('onopen');
    this._proxyEvent('onclose');
    this._proxyEvent('onerror');

    this._socket.onmessage = (...args) => {
      if (args[0] && args[0].data) {
        args[0].jsonData = JSON.parse(args[0].data);
      }

      this.trigger(...['message'].concat(args));
    };
  }

  _proxyEvent(event) {
    this._socket[event] = (...args) => {
      this.trigger(...[event.slice(2)].concat(args));
    };
  }

  close(...args) {
    this._socket.close(...args);
  }

  send(...args) {
    this._socket.send(...args);
  }

  get readyState() {
    return this._socket.readyState;
  }
}
