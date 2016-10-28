import $ from 'jquery';
import app from '../app';
import loadTemplate from '../utils/loadTemplate';
import { launchEditListingModal } from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import ListingShort from '../models/ListingShort';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof ListingShort)) {
      throw new Error('Please provide a ListingShort model.');
    }

    if (!options.listingOwnerGuid) {
      // For search and channels this will need to be included
      // in the API, in which case, we could get the value
      // from the model.
      throw new Error('Please provide a listingOwnerGuid.');
    }

    this.listenTo(this.model, 'change', this.render);

    if (this.ownListing) {
      this.$el.addClass('ownListing');
    }
  }

  className() {
    return 'col clrBr clrT clrP';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  onClickEdit(e) {
    $(e.target).addClass('processing');

    this.fullListing = new Listing({
      listing: { slug: this.model.get('slug') },
    }, {
      guid: app.profile.id,
    });

    this.fullListingFetch = this.fullListing.fetch()
      .done(() => {
        if (this.fullListingFetch.statusText === 'abort') return;

        this.editModal = launchEditListingModal({
          model: this.fullListing,
        });
      }).always(() => {
        $(e.target).removeClass('processing');
        this.fullListingFetch = null;
      });
  }

  get ownListing() {
    return this.options.listingOwnerGuid === app.profile.id;
  }

  cancelListingFetch() {
    if (this.fullListingFetch) this.fullListingFetch.abort();
  }

  remove() {
    this.cancelListingFetch();
    super.remove();
  }

  render() {
    loadTemplate('listingShort.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownerGuid: this.options.listingOwnerGuid,
        ownListing: this.ownListing,
      }));
    });

    return this;
  }
}
