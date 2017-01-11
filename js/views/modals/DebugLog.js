import { remote, ipcRenderer, clipboard } from 'electron';
import '../../utils/velocity';
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

    // If the debug log gets too long, the modal will take a long
    // time to appear because it's taking the browser so long
    // to paint the content. To be simple, for now, we'll just
    // trunacate it if it's beyond a certain length.
    const splitDebugLog = this.debugLog.replace('\r\n', '\n')
      .split('\n');

    if (splitDebugLog.length > this.maxDebugLines) {
      this.debugLog = '< Previous content has been truncated >\n\n' +
        `${splitDebugLog.slice(splitDebugLog.length - this.maxDebugLines).join('\n')}`;
    }

    ipcRenderer.on('server-log', this.onServerConnectLog.bind(this));
  }

  get closeClickTargets() {
    return [
      ...this.$closeClickTargets.get(),
      ...super.closeClickTargets,
    ];
  }

  get maxDebugLines() {
    return 5000;
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
    this.$debugLog.append(msg);
  }

  get $debugLog() {
    return this._$debugLog ||
      (this._$debugLog = this.$('.js-debugLog'));
  }

  get $copiedConfirm() {
    return this._$copiedConfirm ||
      (this._$copiedConfirm = this.$('.js-copiedConfirm'));
  }

  get $closeClickTargets() {
    return this._$closeClickTargets ||
      (this._$closeClickTargets = this.$('.js-closeClickTarget'));
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
      this._$closeClickTargets = null;
    });

    return this;
  }
}
