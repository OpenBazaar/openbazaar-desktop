import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import multihashes from 'multihashes';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!options.listingPrice) {
      throw new Error('Please provide a price for the listing.');
    }

    this.couponCodes = [];
    this.couponHashes = [];
    this.listingPrice = options.listingPrice;
    this.totalDiscount = 0;
    this.coupons = options.coupons;
    this.codeResult = {};
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
    return this.sha256(code).then(hash => {
      const buf = new Buffer(hash, 'hex');
      const encoded = multihashes.encode(buf, 'sha2-256');
      const hashedCode = multihashes.toB58String(encoded);
      const coupon = this.findCoupon(hashedCode, code);
      const discount = this.couponDiscount(coupon);
      this.codeResult = { type: 'valid', code };

      if (coupon) {
        // don't add duplicate coupons
        if (this.couponCodes.indexOf(code) !== -1) {
          this.codeResult = { type: 'duplicate', code };
          // don't add if the total discount is more than the price of the listing
        } else if (this.totalDiscount + discount < this.listingPrice) {
          this.totalDiscount += discount;
          this.couponCodes.push(code);
          this.couponHashes.push(hashedCode);
          this.trigger('changeCoupons', this.couponHashes, this.couponCodes);
        } else {
          this.codeResult = { type: 'excessive', code };
        }
      } else {
        this.codeResult = { type: 'invalid', code };
      }
      this.render();
      return this.codeResult;
    });
  }

  findCoupon(hashedCode, code) {
    return this.coupons.findWhere({ hash: hashedCode }) ||
      this.coupons.findWhere({ discountCode: code });
  }

  couponDiscount(coupon) {
    const percDis = coupon && coupon.get('percentDiscount') || 0;
    const pricDis = coupon && coupon.get('priceDiscount') || 0;
    return (this.listingPrice * percDis * 0.01) + pricDis;
  }

  removeCode(code) {
    const index = this.couponCodes.indexOf(code);
    this.couponCodes.splice(index, 1);
    this.couponHashes.splice(index, 1);
    this.totalDiscount -= this.couponDiscount(this.findCoupon('', code));
    this.trigger('changeCoupons', this.couponHashes, this.couponCodes);
    this.render();
  }

  clickRemove(e) {
    this.removeCode($(e.target).attr('data-code'));
  }

  render() {
    loadTemplate('modals/purchase/coupons.html', t => {
      this.$el.html(t({
        couponCodes: this.couponCodes,
        codeResult: this.codeResult,
      }));
    });

    return this;
  }
}
