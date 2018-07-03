import $ from 'jquery';
import { getAvatarBgImage } from '../../../utils/responsive';
import {
  resolvingDispute,
  resolveDispute,
  events as orderEvents,
} from '../../../utils/order';
import { recordEvent } from '../../../utils/metrics';
import { checkValidParticipantObject } from './OrderDetail.js';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide an ResolveDispute model.');
    }

    if (!options.case) {
      throw new Error('Please provide a Case model.');
    }

    this.case = options.case;

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
    this.listenTo(this.case, 'otherContractArrived', (md, data) => {
      const type = data.isBuyer ? 'buyer' : 'vendor';
      this.$el.toggleClass(`${type}ContractUnavailable`, !this.case.get(`${type}Contract`));
    });

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
    recordEvent('OrderDetails_DisputeResolveConfirmCancel');
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
    recordEvent('OrderDetails_DisputeResolveCancel');
  }

  onClickSubmit() {
    this.getCachedEl('.js-resolveConfirm').removeClass('hide');
    recordEvent('OrderDetails_DisputeResolveSubmit');
    return false;
  }

  onClickConfirmedSubmit() {
    const formData = this.getFormData();
    this.model.set(formData);
    this.model.set({
      buyerPercentage: this.case.get('buyerContract') ?
        formData.buyerPercentage : 0,
      vendorPercentage: this.case.get('vendorContract') ?
        formData.vendorPercentage : 0,
    }, { validate: true });

    if (!this.model.validationError) {
      recordEvent('OrderDetails_DisputeResolveConfirm');
      resolveDispute(this.model);
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
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    super.render();
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
      this.$el.toggleClass('vendorContractUnavailable', !this.case.get('vendorContract'));
      this.$el.toggleClass('buyerContractUnavailable', !this.case.get('buyerContract'));
      this.$el.toggleClass('vendorProcessingError', this.case.vendorProcessingError);
      this.rendered = true;
    });

    return this;
  }
}
