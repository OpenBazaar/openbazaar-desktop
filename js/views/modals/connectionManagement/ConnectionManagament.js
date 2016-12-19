import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      // debugLog: remote.getGlobal('serverLog'),
      // autoUpdate: true,
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} modalTop modalScrollPage`;
  }

  events() {
    return {
      // 'click .js-copy': 'onCopyClick',
      ...super.events(),
    };
  }

  remove() {
    // ipcRenderer.removeListener('server-log', this.onServerConnectLog);
    super.remove();
  }

  render() {
    loadTemplate('modals/connectionManagement/connectionManagement.html', t => {
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
