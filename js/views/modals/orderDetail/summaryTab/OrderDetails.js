import $ from 'jquery';
import app from '../../../../app';
import moment from 'moment';
import { getCountryByDataName } from '../../../../data/countries';
import { convertAndFormatCurrency } from '../../../../utils/currency';
import { clipboard } from 'electron';
import '../../../../utils/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a Contract model.');
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

    if (this.model.get('buyerOrder').payment.moderator) {
      if (!options.moderator) {
        throw new Error('Please provide a moderator object.');
      }

      if (!isValidParticipantObject(options.moderator)) {
        throw new Error(getInvalidParticpantError('moderator'));
      }
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
        moderator: this.modProfile && this.modProfile.toJSON() || null,
      }));

      this._$copiedToClipboard = null;

      if (!this.modProfile && this.options.moderator) {
        this.options.moderator.getProfile()
          .done((modProfile) => {
            this.modProfile = modProfile;
            this.render();
          });
      }
    });

    return this;
  }
}
