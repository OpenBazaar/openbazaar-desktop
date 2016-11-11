import app from '../../app';
import BaseVw from '../baseVw';
import ListingCard from '../ListingCard';

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

    this.viewType = 'grid';
    this.listingCardViews = [];
  }

  className() {
    return 'listingsGrid flex';
  }

  get viewType() {
    return this._viewType;
  }

  set viewType(type) {
    if (['list', 'grid'].indexOf(type) === '-1') {
      throw new Error('The type provided is not one of the available types.');
    }

    const prevType = this._viewType;
    this._viewType = type;

    if (prevType) {
      if (prevType !== this._viewType) {
        this.$el.toggleClass('listingsGridListView');
      }
    } else if (type === 'list') {
      this.$el.addClass('listingsGridListView');
    }
  }

  createListingCardView(opts = {}) {
    const options = {
      ownListing: this.options.storeOwner === app.profile.id,
      listingBaseUrl: `${this.options.storeOwner}/store/`,
      ...opts,
    };

    return this.createChild(ListingCard, options);
  }

  render() {
    this.listingCardViews.forEach(vw => vw.remove());
    this.listingCardViews = [];
    const listingsFrag = document.createDocumentFragment();

    this.collection.forEach(listingShort => {
      const listingCardVw = this.createListingCardView({
        model: listingShort,
      });

      this.listingCardViews.push(listingCardVw);
      listingCardVw.render().$el.appendTo(listingsFrag);
    });

    this.$el.append(listingsFrag);

    return this;
  }
}
