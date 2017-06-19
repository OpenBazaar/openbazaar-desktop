// import {
//   fulfillingOrder,
//   fulfillOrder,
//   events as orderEvents,
// } from '../../../utils/order';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide an OrderFulfillment model.');
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

    if (!options.vendor) {
      throw new Error('Please provide a vendor object.');
    }

    if (!isValidParticipantObject(options.vendor)) {
      throw new Error(getInvalidParticpantError('vendor'));
    }

    if (!options.buyer) {
      throw new Error('Please provide a buyer object.');
    }

    if (!isValidParticipantObject(options.buyer)) {
      throw new Error(getInvalidParticpantError('buyer'));
    }

    // this.listenTo(orderEvents, 'fulfillingOrder', this.onFulfillingOrder);
    // this.listenTo(orderEvents, 'fulfillOrderComplete, fulfillOrderFail',
    //   this.onFulfillOrderAlways);
  }

  className() {
    return 'resolveDisputeTab';
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
    loadTemplate('modals/orderDetail/resolveDispute.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        // fulfillingOrder: fulfillingOrder(this.model.id),
      }));

      this._$btnCancel = null;
      this._$btnSubmit = null;
    });

    return this;
  }
}
