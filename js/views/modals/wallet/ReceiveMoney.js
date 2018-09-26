import { clipboard } from 'electron';
import qr from 'qr-encode';
import { getCurrencyByCode as getWalletCurByCode } from '../../../data/walletCurrencies';
import { polyTFallback } from '../../../utils/templateHelpers';
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
    return 'receiveMoney';
  }

  events() {
    return {
      'click .js-receiveAddress': 'onClickReceiveAddress',
      'click .js-receiveQrCode': 'onClickReceiveQrCode',
    };
  }

  onClickReceiveAddress() {
    this.copyAddressToClipboard();
  }

  onClickReceiveQrCode() {
    this.copyAddressToClipboard();
  }

  copyAddressToClipboard() {
    clipboard.writeText(this.getState().address);
    clearTimeout(this.copyTextFadeoutTimeout);
    this.$copiedText.stop()
      .fadeIn(600, () => {
        this.copyTextFadeoutTimeout = setTimeout(() => {
          this.$copiedText.fadeOut(600);
        }, 1000);
      });
  }

  get $copiedText() {
    return this._$copiedText ||
      (this._$copiedText = this.$('.js-copiedText'));
  }

  render() {
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
          { type: 6, size: 5, level: 'Q' });
      }

      this.$el.html(t({
        ...this._state,
        qrDataUri,
        coinName: polyTFallback(`cryptoCurrencies.${coinType}`, coinType),
        walletCur,
        errors: {},
      }));

      this._$copiedText = null;
    });

    return this;
  }
}
