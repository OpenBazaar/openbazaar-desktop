import {
  openingDispute,
  openDispute,
  events as orderEvents,
} from '../../../utils/order';
import { recordEvent } from '../../../utils/metrics';
import loadTemplate from '../../../utils/loadTemplate';
import { checkValidParticipantObject } from './OrderDetail.js';
import BaseVw from '../../baseVw';
import ModFragment from './ModFragment';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a DisputeOrder model.');
    }

    checkValidParticipantObject(options.moderator, 'moderator');

    options.moderator.getProfile()
      .done((modProfile) => {
        this.modProfile = modProfile;
        if (this.moderatorVw) this.moderatorVw.setState({ ...modProfile.toJSON() });
      });

    this.options = options;

    this.listenTo(orderEvents, 'openingDispute', this.onOpeningDispute);
    this.listenTo(orderEvents, 'openDisputeComplete, openDisputeFail',
      this.onOpenDisputeAlways);
  }

  className() {
    return 'disputeOrderTab';
  }

  events() {
    return {
      'click .js-backToSummary': 'onClickBackToSummary',
      'click .js-cancel': 'onClickCancel',
      'click .js-submit': 'onClickSubmit',
    };
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
    recordEvent('OrderDetails_DisputeSubmitCancel');
  }

  onClickSubmit() {
    const formData = this.getFormData();
    this.model.set(formData);
    this.model.set({}, { validate: true });

    if (!this.model.validationError) {
      recordEvent('OrderDetails_DisputeSubmit');
      openDispute(this.model.id, this.model.toJSON());
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  onOpeningDisputeOrder(e) {
    if (e.id === this.model.id) {
      this.getCachedEl('.js-submit').addClass('processing');
      this.getCachedEl('.js-cancel').addClass('disabled');
    }
  }

  onOpenDisputeAlways(e) {
    if (e.id === this.model.id) {
      this.getCachedEl('.js-submit').removeClass('processing');
      this.getCachedEl('.js-cancel').removeClass('disabled');
    }
  }

  get autoFocusFirstField() {
    return true;
  }

  render() {
    super.render();
    loadTemplate('modals/orderDetail/disputeOrder.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        openingDispute: !!openingDispute(this.model.id),
        timeoutMessage: this.options.timeoutMessage,
      }));

      const moderatorState = {
        peerId: this.options.moderator.id,
        showAvatar: true,
        ...(this.modProfile && this.modProfile.toJSON() || {}),
      };

      if (this.moderatorVw) this.moderatorVw.remove();
      this.moderatorVw = this.createChild(ModFragment, {
        initialState: moderatorState,
      });

      this.$('.js-modContainer').html(this.moderatorVw.render().el);
    });

    return this;
  }
}
