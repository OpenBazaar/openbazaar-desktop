import { clipboard } from 'electron';
import qr from 'qr-encode';
import { getCurrencyByCode as getWalletCurByCode } from '../../../data/walletCurrencies';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      initialState: {
        coinType: 'BTC',
        ...options.initialState,
      },
    });
  }

  className() {
    return 'receiveMoney padMd';
  }

  events() {
    return {
      'click .js-copyAddress': 'copyAddressToClipboard',
      'click .js-receiveAddress': 'copyAddressToClipboard',
      'click .js-receiveQrCode': 'copyAddressToClipboard',
    };
  }

  copyAddressToClipboard() {
    clipboard.writeText(this.getState().address);
    clearTimeout(this.copyTextTimeout);
    const $copyText = this.getCachedEl('.js-copyAddress')
      .addClass('invisible');
    const $copiedText = this.getCachedEl('.js-copiedText')
      .stop()
      .show();

    this.copyTextTimeout = setTimeout(() => {
      $copiedText.hide();
      $copyText.removeClass('invisible');
    }, 1000);
  }

  render() {
    super.render();

    loadTemplate('modals/wallet/receiveMoney.html', (t) => {
      // defaulting to an empty image - needed for proper spacing
      // when the spinner is showing
      let qrDataUri = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      const address = this.getState().address;
      const coinType = this.getState().coinType;
      let walletCur;

      try {
        walletCur = getWalletCurByCode(coinType);
      } catch (e) {
        // pass
      }

      if (address && walletCur) {
        qrDataUri = qr(walletCur.qrCodeText(address),
          { type: 7, size: 5, level: 'M' });
      }

      this.$el.html(t({
        ...this._state,
        qrDataUri,
        coinName: app.polyglot.t(`cryptoCurrencies.${coinType}`, { _: coinType }),
      }));
    });

    return this;
  }
}
