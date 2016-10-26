// import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);
    this.options = options;

    if (options.initialFetch) {
      this.fetch = options.initialFetch;
      this.onRequest(this.model, this.fetch);
    }

    this.listenTo(this.model, 'request', this.onRequest);
  }

  className() {
    return `${super.className()} listingDetail modalTop`;
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
      'click .js-editListing': 'onClickEditListing',
      ...super.events(),
    };
  }

  onRequest(md, xhr) {
    this.fetch = xhr;
    if (!this.retryPressed) this.render();

    const startTime = Date.now();

    xhr.always(() => {
      if (xhr.state() === 'rejected') {
        // if fetch is triggered by retry button and
        // it immediately fails, it looks like nothing happend,
        // so, we'll make sure it takes a minimum time.
        const callTime = Date.now() - startTime;

        if (callTime < 250) {
          setTimeout(() => {
            this.retryPressed = false;
            this.render();
          }, 250 - callTime);
        }
      } else {
        this.retryPressed = false;
        this.render();
      }
    });
  }

  onClickEditListing() {
    // open edit listing modal
    this.editModal = launchEditListingModal({
      model: this.model,
      returnText: app.polyglot.t('listingDetail.editListingReturnText'),
    });

    this.$el.addClass('hide');

    let removedViaReturnClick = false;

    this.listenTo(this.editModal, 'close', () => {
      if (!removedViaReturnClick) {
        this.close();

        if (!this.isRemoved()) {
          this.$el.removeClass('hide');
        }
      }
    });

    this.listenTo(this.editModal, 'click-return', () => {
      removedViaReturnClick = true;
      this.editModal.remove();
      this.$el.removeClass('hide');
    });
  }

  onClickRetryFetch() {
    this.retryPressed = true;
    this.model.fetch();
    this.$btnRetry.addClass('processing');
  }

  get $btnRetry() {
    return this._$btnRetry || this.$('.js-retryFetch');
  }

  remove() {
    if (this.editModal) this.editModal.remove();
    super.remove();
  }

  render() {
    loadTemplate('modals/listingDetail/listing.html', t => {
      const listing = this.model.get('listing');

      this.$el.html(t({
        ...listing.toJSON(),
        // ownListing won't be accurate until the fetch successfully completes
        ownListing: this.fetch && this.fetch.state() === 'resolved' &&
          listing.get('vendorID').guid === app.profile.id,
        isFetching: this.fetch && this.fetch.state() === 'pending',
        fetchFailed: this.fetch && this.fetch.state() === 'rejected',
        fetchFailReason: this.fetch && this.fetch.state() === 'rejected' &&
          this.fetch.responseText || '',
      }));

      super.render();

      this._$btnRetry = null;
    });

    return this;
  }
}
