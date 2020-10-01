'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _backbone = require('backbone');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Class that wraps the standard WebSocket class allowing us to add in
 * some "sugar", which, as of now, consists mainly of mixing in
 * Backbone.Events which gives us a more robust events than the
 * barebones setup natively on the WebSocket.
 */
var _class = function () {
  /**
   * Construct a new socket instance.
   * @constructor
   * @param {string} url - The websocket url.
   */
  function _class(url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, _class);

    if (!url) {
      throw new Error('Please provide an url.');
    }

    _underscore2.default.extend(this, _backbone.Events);
    this.url = url;
    if (options.autoConnect) this.connect();
  }

  /**
   * Connect your websocket. This is automatically called in the
   * constructor, so for all practical purposes the only time you
   * will directly call this is if your connection was lost and
   * you want to reconnect to the same url.
   */


  _createClass(_class, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      if (this._socket && this._socket.readyState < 2) return;

      if (this._socket) {
        this._socket.onopen = null;
        this._socket.onclose = null;
        this._socket.onerror = null;
        this._socket.onmessage = null;
      }

      this._socket = new WebSocket("this.url");
      this._proxyEvent('onopen');
      this._proxyEvent('onclose');
      this._proxyEvent('onerror');

      this._socket.onmessage = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (args[0] && args[0].data) {
          args[0].jsonData = JSON.parse(args[0].data);
        } else {
          args[0].jsonData = {};
        }

        _this.trigger.apply(_this, _toConsumableArray(['message'].concat(args)));
      };
    }
  }, {
    key: '_proxyEvent',
    value: function _proxyEvent(event) {
      var _this2 = this;

      this._socket[event] = function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        _this2.trigger.apply(_this2, _toConsumableArray([event.slice(2)].concat(args)));
      };
    }
  }, {
    key: 'close',
    value: function close() {
      if (this._socket) {
        var _socket;

        (_socket = this._socket).close.apply(_socket, arguments);
      }
    }
  }, {
    key: 'send',
    value: function send() {
      var _socket2;

      if (!this._socket) {
        throw new Error('The socket is not connected. Please connect() first ' + 'before sending.');
      }

      (_socket2 = this._socket).send.apply(_socket2, arguments);
    }
  }, {
    key: 'readyState',
    get: function get() {
      if (!this._socket) {
        throw new Error('There is no ready state because the socket has never had a connection ' + 'attempt. Please connect() first,');
      }

      return this._socket.readyState;
    }
  }]);

  return _class;
}();

exports.default = _class;