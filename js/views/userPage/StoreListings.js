import app from '../../app';
// import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import ListingShort from '../ListingShort';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!this.options.storeOwner) {
      // For search and channels this will need to be provided
      // with the listing index data, in which case this
      // option could be made truly optional.
      throw new Error('Please provide the guid of the storeOwner.');
    }

    this.listingShortViews = [];
  }

  className() {
    return 'listingsWrap flex';
  }

  events() {
    return {
      // 'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  createListingShortView(opts = {}) {
    const options = {
      ownListing: this.options.storeOwner === app.profile.id,
      listingBaseUrl: `${this.options.storeOwner}/store/`,
      ...opts,
    };

    return this.createChild(ListingShort, options);
  }

  render() {
    this.listingShortViews.forEach(vw => vw.remove());
    this.listingShortViews = [];
    const listingsFrag = document.createDocumentFragment();

    this.collection.forEach(listingShort => {
      const listingShortVw = this.createListingShortView({
        model: listingShort,
      });

      this.listingShortViews.push(listingShortVw);
      listingShortVw.render().$el.appendTo(listingsFrag);
    });

    this.$el.append(listingsFrag);

    return this;
  }
}
