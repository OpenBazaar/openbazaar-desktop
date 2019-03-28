import app from '../../app';
import BaseVw from '../baseVw';
import ListingCard from '../components/ListingCard';

export default class extends BaseVw {
  constructor(options = {}) {
    // If this grid is for a Store, pass in a storeOwnerProfile option
    // with the Profile model of the store owner.
    const opts = {
      viewType: app.localSettings.get('listingsGridViewType'),
      ...options,
    };

    super(opts);
    this.options = opts;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!this.options.listingBaseUrl && !this.options.storeOwnerProfile) {
      let allHaveVendor = true;

      try {
        this.collection.forEach(md => {
          if (!md.get('vendor')) throw new Error();
        });
      } catch (e) {
        allHaveVendor = false;
      }

      if (!allHaveVendor) {
        throw new Error('I am unable to determine a listingBaseUrl for one or more of the ' +
          'provided listings. Please either pass in a listingBaseUrl option or it can be ' +
          'derived if you provid a storeOwnerProfile option or every model has an embedded ' +
          ' Vendor object.');
      }
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

  createListingCardView(model) {
    let listingBaseUrl;

    // The listingBaseUrl can be directly provided as an option or we
    // will attempt to derive it from a passed in Profile model or
    // Vendor information in the listing short models.
    if (this.options.listingBaseUrl) {
      listingBaseUrl = this.options.listingBaseUrl;
    } else if (model.get('vendor')) {
      const base = model.get('vendor').handle ?
        `@${model.get('vendor').handle}` : model.get('vendor').peerID;
      listingBaseUrl = `${base}/store/`;
    } else if (this.options.storeOwnerProfile) {
      const base = this.options.storeOwnerProfile.get('handle') ?
        `@${this.options.storeOwnerProfile.get('handle')}` :
          this.options.storeOwnerProfile.id;
      listingBaseUrl = `${base}/store/`;
    }

    const options = {
      listingBaseUrl,
      viewType: this.viewType,
      model,
    };

    if (this.options.storeOwnerProfile) {
      options.profile = this.options.storeOwnerProfile;
      // Flag so the listing card knows it's on a store. This is useful to
      // the listing detail modal and will be passed into there.
      options.onStore = true;
    }

    return this.createChild(ListingCard, options);
  }

  renderListingCards(models = []) {
    const listingsFrag = document.createDocumentFragment();

    models.forEach(model => {
      // In the proposed search API, vendor info will be provided in the
      // search results. If that's the case we'll pass it to the listing
      // card view.
      const listingCardVw = this.createListingCardView(model);

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
