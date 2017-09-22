import { clipboard, remote } from 'electron';
import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import qr from 'qr-encode';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      ...options.initialState || {},
    };
  }

  className() {
    return 'receiveMoney';
  }

  events() {
    return {
      'click .js-receiveAddress': 'onClickReceiveAddress',
      'click .js-receiveQrCode': 'onClickReceiveQrCode',
      'click .js-cancelReceiveBtn': 'onClickCancelReceive',
      'click .js-fundViaShapeshift': 'onClickFundViaShapshift',
    };
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

  onClickReceiveAddress() {
    this.copyAddressToClipboard();
  }

  onClickReceiveQrCode() {
    this.copyAddressToClipboard();
  }

  onClickCancelReceive() {
    this.trigger('click-cancel');
  }

  onClickFundViaShapshift() {
    const shapeshiftURL = `https://shapeshift.io/shifty.html?destination=${this.getState().address}&amp;output=BTC&apiKey=6e9fbc30b836f85d339b84f3b60cade3f946d2d49a14207d5546895ecca60233b47ec67304cdcfa06e019231a9d135a7965ae50de0a1e68d6ec01b8e57f2b812`;
    const shapeshiftWin = new remote.BrowserWindow({ width: 700, height: 500, frame: true });
    shapeshiftWin.loadURL(shapeshiftURL);
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

      if (address) {
        qrDataUri = qr(`bitcoin:${address}`,
          { type: 6, size: 5, level: 'Q' });
      }

      this.$el.html(t({
        ...this._state,
        qrDataUri,
        errors: {},
      }));

      this._$copiedText = null;
    });

    return this;
  }
}
