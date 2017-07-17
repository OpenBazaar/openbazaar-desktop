import $ from 'jquery';
import { getAvatarBgImage } from '../../../utils/responsive';
import {
  resolvingDispute,
  resolveDispute,
  events as orderEvents,
} from '../../../utils/order';
import { checkValidParticipantObject } from './OrderDetail.js';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide an OrderFulfillment model.');
    }

    checkValidParticipantObject(options.buyer, 'buyer');
    checkValidParticipantObject(options.vendor, 'vendor');

    options.buyer.getProfile().done(profile => {
      this.buyerProfile = profile;
      if (this.rendered) {
        this.getCachedEl('.js-buyerName').text(this.buyerProfile.get('name'));
        this.getCachedEl('.js-buyerAvatar')
          .attr('style', getAvatarBgImage(profile.get('avatarHashes').toJSON()));
      }
    });

    options.vendor.getProfile().done(profile => {
      this.vendorProfile = profile;
      if (this.rendered) {
        this.getCachedEl('.js-vendorName').text(this.vendorProfile.get('name'));
        this.getCachedEl('.js-vendorAvatar')
          .attr('style', getAvatarBgImage(profile.get('avatarHashes').toJSON()));
      }
    });

    this.listenTo(orderEvents, 'resolvingDispute', this.onResolvingDispute);
    this.listenTo(orderEvents, 'resolveDisputeComplete resolveDisputeFail',
      this.onResolveDisputeAlways);

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'resolveDisputeTab';
  }

  events() {
    return {
      'click .js-backToSummary': 'onClickBackToSummary',
      'click .js-cancel': 'onClickCancel',
      'click .js-submit': 'onClickSubmit',
      'click .js-resolveConfirmed': 'onClickConfirmedSubmit',
      'click .js-resolveConfirm': 'onClickResolveConfirmBox',
      'click .js-resolveConfirmCancel': 'onClickCancelConfirm',
    };
  }

  onClickResolveConfirmBox() {
    // ensure event doesn't bubble so onDocumentClick doesn't
    // close the confirmBox.
    return false;
  }

  onClickCancelConfirm() {
    this.getCachedEl('.js-resolveConfirm').addClass('hide');
  }

  onDocumentClick() {
    this.getCachedEl('.js-resolveConfirm').addClass('hide');
  }

  onClickBackToSummary() {
    this.trigger('clickBackToSummary');
  }

  onClickCancel() {
    const id = this.model.id;
    this.model.reset();
    // restore the id reset blew away
    this.model.set({ orderId: id });
    this.render();
    this.trigger('clickCancel');
  }

  onClickSubmit() {
    this.getCachedEl('.js-resolveConfirm').removeClass('hide');
    return false;
  }

  onClickConfirmedSubmit() {
    const formData = this.getFormData();
    this.model.set(formData);
    this.model.set({}, { validate: true });

    if (!this.model.validationError) {
      resolveDispute(this.model.id, this.model.toJSON());
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  onResolvingDispute(e) {
    if (e.id === this.model.id) {
      this.getCachedEl('.js-submit').addClass('processing');
      this.getCachedEl('.js-cancel').addClass('disabled');
    }
  }

  onResolveDisputeAlways(e) {
    if (e.id === this.model.id) {
      this.getCachedEl('.js-submit').removeClass('processing');
      this.getCachedEl('.js-cancel').removeClass('disabled');
    }
  }

  remove() {
    $(document).off(null, this.boundOnDocClick);
    super.remove();
  }

  render() {
    this.clearCachedElementMap();
    loadTemplate('modals/orderDetail/resolveDispute.html', (t) => {
      const templateData = {
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        resolvingDispute: resolvingDispute(this.model.id),
      };

      if (this.buyerProfile) {
        templateData.buyerAvatarHashes = this.buyerProfile.get('avatarHashes').toJSON();
        templateData.buyerName = this.buyerProfile.get('name');
      }

      if (this.vendorProfile) {
        templateData.vendorAvatarHashes = this.vendorProfile.get('avatarHashes').toJSON();
        templateData.vendorName = this.vendorProfile.get('name');
      }

      this.$el.html(t(templateData));
      this.rendered = true;
    });

    return this;
  }
}
