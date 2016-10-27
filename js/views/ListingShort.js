import app from '../../../app';
import loadTemplate from '../utils/loadTemplate';
import { launchEditListingModal } from '../utils/modalManager';
import ListingShort from '../models/ListingShort';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof ListingShort)) {
      throw new Error('Please provide a ListingShort model.');
    }

    // todo: !!!!Why ownListing & ownerGuid, derive ownListing
    // from ownerGuid.
    if (!options.listingOwnerGuid) {
      throw new Error('Please provide a listingOwnerGuid.');
    }

    this.listenTo(this.model, 'change', this.render);

    if (this.options.ownListing) {
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

  onClickEdit() {
  }

  render() {
    loadTemplate('listingShort.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownerGuid: this.options.listingOwnerGuid,
        ownListing: this.options.ownListing || false,
      }));
    });

    return this;
  }
}
