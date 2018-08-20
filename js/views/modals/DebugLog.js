import { remote, ipcRenderer, clipboard } from 'electron';
import '../../utils/lib/velocity';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      debugLog: remote.getGlobal('serverLog'),
      autoUpdate: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.debugLog = opts.debugLog;

    ipcRenderer.on('server-log', this.onServerConnectLog.bind(this));
  }

  get maxDebugLines() {
    return 1000;
  }

  className() {
    return `${super.className()} modalScrollPage`;
  }

  events() {
    return {
      'click .js-copy': 'onCopyClick',
      ...super.events(),
    };
  }

  onCopyClick() {
    clipboard.writeText(this.$debugLog.text());
    this.$copiedConfirm
      .velocity('stop')
      .velocity('fadeIn')
      .velocity('fadeOut', { delay: 1000 });
  }

  onServerConnectLog(e, msg) {
    this.debugLog += msg;

    if (this.isOpen()) {
      // re-rendering while the modal is open might be too disruptive (e.g. scroll position would
      // be lost)
      this.$debugLog.append(msg);
    } else {
      // If the modal is not open, we'll re-render since that will use the updated debug log which
      // was truncated if too long.
      this.render();
    }
  }

  get debugLog() {
    return this._debugLog;
  }

  set debugLog(log) {
    if (typeof log !== 'string') {
      throw new Error('Please provide the log as a string.');
    }

    // If the debug log gets too long, the modal will take a long time to render because it's taking
    // the browser so long to paint the content. To be simple, for now, we'll just truncate it if
    // it's beyond a certain number of lines.
    const splitLog = log.replace('\r\n', '\n')
      .split('\n');

    if (splitLog.length > this.maxDebugLines) {
      this._debugLog = '< Previous content has been truncated >\n\n' +
        `${splitLog.slice(splitLog.length - this.maxDebugLines).join('\n')}`;
    } else {
      this._debugLog = log;
    }
  }

  get $debugLog() {
    return this._$debugLog ||
      (this._$debugLog = this.$('.js-debugLog'));
  }

  get $copiedConfirm() {
    return this._$copiedConfirm ||
      (this._$copiedConfirm = this.$('.js-copiedConfirm'));
  }

  remove() {
    ipcRenderer.removeListener('server-log', this.onServerConnectLog);
    super.remove();
  }

  render() {
    loadTemplate('modals/debugLog.html', t => {
      this.$el.html(t({
        debugLog: this.debugLog,
      }));

      super.render();

      this._$debugLog = null;
      this._$copiedConfirm = null;
    });

    return this;
  }
}
