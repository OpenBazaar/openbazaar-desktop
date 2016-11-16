import app from '../../app';
import BaseVw from '../baseVw';
import ListingCard from '../ListingCard';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      viewType: app.localSettings.get('listingsGridViewType'),
      ...options,
    };

    super(opts);
    this.options = opts;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!this.options.storeOwner) {
      // For search and channels this will need to be provided
      // with the listing index data, in which case this
      // option could be made truly optional.
      throw new Error('Please provide the guid of the storeOwner.');
    }

    this.viewType = opts.viewType;
    this.listingCardViews = [];

    this.listenTo(this.collection, 'update', (updatedCl, updateOpts) => {
      // The only updates we're expecting are a new "page" of
      // listings being added to the end of the collection.
      if (updateOpts.add) {
        this.renderListingCards(updateOpts.changes.added);
      }
    });
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

    // This just sets the flag. It's up to you to re-render to update the UI.
    this._viewType = type;
    app.localSettings.save('listingsGridViewType', type);
  }

  get listingCount() {
    return this.listingCardViews ?
      this.listingCardViews.length : 0;
  }

  createListingCardView(opts = {}) {
    const options = {
      ownListing: this.options.storeOwner === app.profile.id,
      listingBaseUrl: `${this.options.storeOwner}/store/`,
      viewType: this.viewType,
      ...opts,
    };

    return this.createChild(ListingCard, options);
  }

  renderListingCards(models = []) {
    const listingsFrag = document.createDocumentFragment();

    models.forEach(model => {
      const listingCardVw = this.createListingCardView({ model });
      this.listingCardViews.push(listingCardVw);
      listingCardVw.render().$el.appendTo(listingsFrag);
    });

    this.$el.append(listingsFrag);
  }

  render() {
    this.$el[this.viewType === 'list' ? 'addClass' : 'removeClass']('listingsGridListView');
    this.listingCardViews.forEach(vw => vw.remove());
    this.listingCardViews = [];
    this.$el.empty();
    this.renderListingCards(this.collection);

    return this;
  }
}

// Standard width grid has 3 columns, so best to leave this
// as a multiple of 3.
export const LISTINGS_PER_PAGE = 24;
