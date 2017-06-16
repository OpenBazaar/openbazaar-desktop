// import {
//   fulfillingOrder,
//   fulfillOrder,
//   events as orderEvents,
// } from '../../../utils/order';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import ModFragment from './ModFragment';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide an DisputeOrder model.');
    }

    const isValidParticipantObject = (participant) => {
      let isValid = true;
      if (!participant.id) isValid = false;
      if (typeof participant.getProfile !== 'function') isValid = false;
      return isValid;
    };

    const getInvalidParticpantError = (type = '') =>
      (`The ${type} object is not valid. It should have an id ` +
        'as well as a getProfile function that returns a promise that ' +
        'resolves with a profile model.');

    if (!options.moderator) {
      throw new Error('Please provide a moderator object.');
    }

    if (!isValidParticipantObject(options.moderator)) {
      throw new Error(getInvalidParticpantError('moderator'));
    }

    options.moderator.getProfile()
      .done((modProfile) => {
        this.modProfile = modProfile;
        if (this.moderatorVw) this.moderatorVw.setState({ ...modProfile.toJSON() });
      });

    this.options = options;

    // this.listenTo(orderEvents, 'fulfillingOrder', this.onFulfillingOrder);
    // this.listenTo(orderEvents, 'fulfillOrderComplete, fulfillOrderFail',
    //   this.onFulfillOrderAlways);
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
  }

  onClickSubmit() {
    const formData = this.getFormData();
    this.model.set(formData);
    this.model.set({}, { validate: true });

    if (!this.model.validationError) {
      // fulfillOrder(this.model.id, this.model.toJSON());
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  // onFulfillingOrder(e) {
  //   if (e.id === this.model.id) {
  //     this.$btnSubmit.addClass('processing');
  //     this.$btnCancel.addClass('disabled');
  //   }
  // }

  // onFulfillOrderAlways(e) {
  //   if (e.id === this.model.id) {
  //     this.$btnSubmit.removeClass('processing');
  //     this.$btnCancel.removeClass('disabled');
  //   }
  // }

  render() {
    loadTemplate('modals/orderDetail/disputeOrder.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        // fulfillingOrder: fulfillingOrder(this.model.id),
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
