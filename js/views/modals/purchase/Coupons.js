import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import multihashes from 'multihashes';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.couponCodes = [];
    this.couponHashes = [];
    this.listingHashes = options.coupons.pluck('hash');
    this.invalidCode = '';
  }

  className() {
    return 'coupons';
  }

  events() {
    return {
      'click .js-remove': 'clickRemove',
    };
  }

  sha256(str) {
    // adapted from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    const buffer = new TextEncoder('utf-8').encode(str);
    return crypto.subtle.digest('SHA-256', buffer).then(hash => this.hex(hash));
  }

  hex(buffer) {
    // adapted from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
      const value = view.getUint32(i);
      const stringValue = value.toString(16);
      const padding = '00000000';
      const paddedValue = (padding + stringValue).slice(-padding.length);
      hexCodes.push(paddedValue);
    }

    return hexCodes.join('');
  }


  addCode(code) {
    this.sha256(code).then(hash => {
      const buf = new Buffer(hash, 'hex');
      const encoded = multihashes.encode(buf, 'sha2-256');
      const hashedCode = multihashes.toB58String(encoded);

      if (this.listingHashes.indexOf(hashedCode) !== -1 && this.couponCodes.indexOf(code) === -1) {
        this.couponCodes.push(code);
        this.couponHashes.push(hashedCode);
        this.invalidCode = '';
        this.duplicateCode = '';
        this.trigger('changeCoupons');
      } else if (this.couponCodes.indexOf(code) !== -1) {
        this.invalidCode = '';
        this.duplicateCode = code;
      } else {
        this.invalidCode = code;
        this.duplicateCode = '';
      }
      this.render();
    });
  }

  removeCode(code) {
    const index = this.couponCodes.indexOf(code);
    this.couponCodes.splice(index, 1);
    this.couponHashes.splice(index, 1);
    this.trigger('changeCoupons');
    this.render();
  }

  clickRemove(e) {
    this.removeCode($(e.target).attr('data-code'));
  }

  render() {
    loadTemplate('modals/purchase/coupons.html', t => {
      this.$el.html(t({
        couponCodes: this.couponCodes,
        invalidCode: this.invalidCode,
        duplicateCode: this.duplicateCode,
      }));
    });

    return this;
  }
}
