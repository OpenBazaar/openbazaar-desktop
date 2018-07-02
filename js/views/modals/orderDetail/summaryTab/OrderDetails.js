import _ from 'underscore';
import $ from 'jquery';
import app from '../../../../app';
import moment from 'moment';
import { getCountryByDataName } from '../../../../data/countries';
import { convertAndFormatCurrency } from '../../../../utils/currency';
import { clipboard } from 'electron';
import '../../../../utils/lib/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import ModFragment from '../ModFragment';
import { checkValidParticipantObject } from '../OrderDetail.js';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a Contract model.');
    }

    if (this.isModerated()) {
      checkValidParticipantObject(options.moderator, 'moderator');

      options.moderator.getProfile()
        .done((modProfile) => {
          this.modProfile = modProfile;
          if (this.moderatorVw) this.moderatorVw.setState({ ...modProfile.toJSON() });
        });
    }

    this.options = options;
    this.listing = this.model.get('vendorListings').at(0);
    this.order = this.model.get('buyerOrder');
  }

  className() {
    return 'orderDetails';
  }

  events() {
    return {
      'click .js-copyAddress': 'onClickCopyAddress',
      'click .js-copyCryptoAddress': 'onClickCopyCryptoAddress',
      'click .js-copyCryptoQuantity': 'onClickCopyCryptoQuantity',
    };
  }

  onClickCopyAddress(e) {
    clipboard.writeText($(e.target).data('address') || '');
    this.$copiedToClipboard
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.$copiedToClipboard
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  onClickCopyCryptoAddress(e) {
    clipboard.writeText($(e.target).data('address') || '');
    this.getCachedEl('.js-cryptoAddressCopiedToClipboard')
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.getCachedEl('.js-cryptoAddressCopiedToClipboard')
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  onClickCopyCryptoQuantity(e) {
    clipboard.writeText($(e.target).data('quantity').toString());
    this.getCachedEl('.js-cryptoQuantityCopiedToClipboard')
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.getCachedEl('.js-cryptoQuantityCopiedToClipboard')
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  isModerated() {
    return !!this.model.get('buyerOrder').payment.moderator;
  }

  /**
   * If the product purchased has a sku, it will be returned, otherwise an empty string
   * will be returned.
   */
  get sku() {
    let orderOptions;
    let options;
    let skus;
    const listing = this.listing.toJSON();

    try {
      orderOptions = this.order.items[0].options;
      options = listing.item.options;
      skus = listing.item.skus;
    } catch (e) {
      return '';
    }

    if (orderOptions && orderOptions.length && orderOptions.length === options.length) {
      // variants are present
      const indexes = [];

      orderOptions.forEach(orderOpt => {
        const matchingOpt = options.find(opt => opt.name === orderOpt.name);

        if (matchingOpt && matchingOpt.variants && matchingOpt.variants.length) {
          const matchingVariant =
            matchingOpt.variants.find(variant => variant.name === orderOpt.value);
          if (matchingVariant) indexes.push(matchingOpt.variants.indexOf(matchingVariant));
        }
      });

      if (Array.isArray(skus)) {
        const matchingSku = skus.find(sku => _.isEqual(sku.variantCombo, indexes));
        return matchingSku && matchingSku.productID || '';
      }
    } else {
      // no variants
      return listing.item.productID || '';
    }

    return '';
  }

  get $copiedToClipboard() {
    return this._$copiedToClipboard ||
      (this._$copiedToClipboard = this.$('.js-orderDetailsCopiedToClipboard'));
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/orderDetails.html', (t) => {
      this.$el.html(t({
        listing: this.listing.toJSON(),
        order: this.order,
        getCountryByDataName,
        convertAndFormatCurrency,
        userCurrency: app.settings.get('localCurrency'),
        moment,
        isModerated: this.isModerated(),
        sku: this.sku,
        locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang()
          || 'en-US',
      }));

      this._$copiedToClipboard = null;

      if (this.isModerated()) {
        const moderatorState = {
          peerId: this.options.moderator.id,
          ...(this.modProfile && this.modProfile.toJSON() || {}),
        };

        if (this.moderatorVw) this.moderatorVw.remove();
        this.moderatorVw = this.createChild(ModFragment, {
          initialState: moderatorState,
        });

        this.$('.js-moderatorContainer').html(this.moderatorVw.render().el);
      }
    });

    return this;
  }
}
