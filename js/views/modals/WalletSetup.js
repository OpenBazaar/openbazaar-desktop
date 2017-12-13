import { remote } from 'electron';
import { getTranslatedCurrencies } from '../../data/cryptoCurrencies';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      ...options,
    };

    super(opts);

    const curUrls = {
      BTC: 'https://bitcoin.org/',
      BCH: 'https://bitcoincash.org/',
      ZEC: 'https://z.cash',
    };

    this.cryptoCurs = getTranslatedCurrencies().map(cur => ({
      ...cur,
      url: curUrls[cur.code] || '',
    }));
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-browseZcashBinary': 'onClickBrowseZcashBinary',
      ...super.events(),
    };
  }

  onClickBrowseZcashBinary() {
    remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, e => {
      this.getCachedEl('.js-inputZcashBinaryPath').val(e[0] || '');
    });
  }

  render() {
    super.render();
    loadTemplate('modals/walletSetup.html', t => {
      this.$el.html(t({
        cryptoCurs: this.cryptoCurs,
      }));
      super.render();
    });

    return this;
  }
}
