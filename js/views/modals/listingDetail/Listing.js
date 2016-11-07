import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: false,
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} listingDetail modalTop`;
  }

  events() {
    return {
      'click .js-editListing': 'onClickEditListing',
      'click .js-deleteListing': 'onClickDeleteListing',
      ...super.events(),
    };
  }

  onClickEditListing() {
    this.editModal = launchEditListingModal({
      model: this.model,
      returnText: app.polyglot.t('listingDetail.editListingReturnText'),
    });

    this.$el.addClass('hide');

    const onCloseEditModal = () => {
      this.close();

      if (!this.isRemoved()) {
        this.$el.removeClass('hide');
      }
    };

    this.listenTo(this.editModal, 'close', onCloseEditModal);

    const onEditModalClickReturn = () => {
      this.stopListening(null, null, onCloseEditModal);
      this.editModal.remove();
      this.$el.removeClass('hide');
    };

    this.listenTo(this.editModal, 'click-return', onEditModalClickReturn);
  }

  onClickDeleteListing() {
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;

    this.destroyRequest = this.model.destroy({ wait: true });

    if (this.destroyRequest) {
      this.$deleteListing.addClass('processing');

      this.destroyRequest.done(() => {
        if (this.destroyRequest.statusText === 'abort' ||
          this.isRemoved()) return;

        this.close();
      }).always(() => {
        if (!this.isRemoved()) {
          this.$deleteListing.removeClass('processing');
        }
      });
    }
  }

  get $deleteListing() {
    return this._$deleteListing || this.$('.js-deleteListing');
  }

  remove() {
    if (this.editModal) this.editModal.remove();
    if (this.destroyRequest) this.destroyRequest.abort();
    super.remove();
  }

  render() {
    loadTemplate('modals/listingDetail/listing.html', t => {
      const listing = this.model.get('listing');

      this.$el.html(t({
        ...listing.toJSON(),
        // todo: Will the api to return our own listing return vendorID. Perhaps
        // we centralize the ownListing determination in the listing model?
        ownListing: listing.get('vendorID').guid === app.profile.id,
      }));

      super.render();

      this._$deleteListing = null;
    });

    return this;
  }
}
