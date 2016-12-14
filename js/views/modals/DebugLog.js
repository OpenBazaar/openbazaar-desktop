import { remote, ipcRenderer } from 'electron';
import loadTemplate from '../../utils/loadTemplate';
import Clipboard from 'clipboard';
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

    // If the debug log gets too long, the modal will take a long
    // time to appear because it's taking the browser so long
    // to paint the content. To be simple, for now, we'll just
    // trunacate it if it's beyond a certain length.
    const splitDebugLog = this.debugLog.replace('\r\n', '\n')
      .split('\n');

    if (splitDebugLog.length > this.maxDebugLines) {
      this.debugLog = '< Previous content has been truncated (translate) >\n\n' +
        `${splitDebugLog.slice(splitDebugLog.length - this.maxDebugLines).join('\n')}`;
    }

    ipcRenderer.on('server-log', this.onServerConnectLog.bind(this));
  }

  get maxDebugLines() {
    return 5000;
  }

  className() {
    return `${super.className()} modalTop`;
  }

  events() {
    return {
      ...super.events(),
    };
  }

  onServerConnectLog(e, msg) {
    this.$debugLog.append(msg);
  }

  get $debugLog() {
    return this._$debugLog ||
      (this._$debugLog = this.$('.js-debugLog'));
  }

  remove() {
    ipcRenderer.removeListener('server-log', this.onServerConnectLog);
    this.clipboard.destroy();
    super.remove();
  }

  render() {
    loadTemplate('modals/debugLog.html', t => {
      this.$el.html(t({
        debugLog: this.debugLog,
      }));

      super.render();

      this._$debugLog = null;

      if (this.clipboard) this.clipboard.destroy();
      this.clipboard = new Clipboard(this.$('.js-copy')[0], {
        text: () => this.$debugLog.val(),
      });
    });

    return this;
  }
}
