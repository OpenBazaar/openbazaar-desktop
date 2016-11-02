import $ from 'jquery';
import 'select2';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import Listing from '../../models/listing/Listing';
import Listings from '../../collections/Listings';
import BaseVw from '../baseVw';
// import ListingShort from '../ListingShort';
import ListingDetail from '../modals/listingDetail/Listing';
import StoreListings from './StoreListings';
import CategoryFilter from './CategoryFilter';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    if (options.initialFetch) {
      this.fetch = options.initialFetch;
      this.onRequest(this.collection, this.fetch);
    }

    this.listenTo(this.collection, 'request', this.onRequest);

    this.filter = {
      category: 'all',
    };
  }

  className() {
    return 'userPageStore';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
      'change .js-filterFreeShipping': 'onFilterFreeShippingChange',
    };
  }

  onFilterFreeShippingChange(e) {
    this.filter.freeShipping = $(e.target).is(':checked');
    this.renderListings(this.filteredCollection());
  }

  onRequest(cl, xhr) {
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

  onClickRetryFetch() {
    this.retryPressed = true;
    this.collection.fetch();
    this.$btnRetry.addClass('processing');
  }

  /**
   * When a listing card is clicked, the listingShort view will manage showing the
   * listing detail modal. This method is used when this view initially loads and a
   * listing was part of the url. Since we don't want to wait until the entire
   * (unpaginated) store is fetched before showing the listing, we are expecting the
   * the listing model to be passed in as an arg (currently the router is fetching it).
   * The store will continue to load in the background.
   */
  showListing(listing) {
    if (!listing instanceof Listing) {
      throw new Error('Please provide a listing model.');
    }

    const onListingDetailClose = () => app.router.navigate(`${this.model.id}/store`);

    this.listingDetail = new ListingDetail({
      model: listing,
    }).render()
      .open();

    this.listenTo(this.listingDetail, 'close', onListingDetailClose);
    this.listenTo(this.listingDetail, 'modal-will-remove',
      () => this.stopListening(null, null, onListingDetailClose));
  }

  get tabClass() {
    return 'store';
  }

  get $btnRetry() {
    return this._$btnRetry ||
      (this._$btnRetry = this.$('.js-retryFetch'));
  }

  get $listingsContainer() {
    return this._$listingsContainer ||
      (this._$listingsContainer = this.$('.js-listingsContainer'));
  }

  get $catFilterContainer() {
    return this._$catFilterContainer ||
      (this._$catFilterContainer = this.$('.js-catFilterContainer'));
  }

  filteredCollection(filter = this.filter, collection = this.collection) {
    const models = collection.models.filter((md) => {
      let passesFilter = true;

      if (this.filter.freeShipping && !md.shipsFreeToMe) {
        passesFilter = false;
      }

      if (this.filter.category !== 'all' &&
        md.get('category').indexOf(this.filter.category) === -1) {
        passesFilter = false;
      }

      return passesFilter;
    });

    return new Listings(models);
  }

  renderListings(col) {
    if (!col) {
      throw new Error('Please provide a collection.');
    }

    if (!this.storeListings) {
      this.storeListings = new StoreListings({
        collection: col,
        storeOwner: this.model.id,
      });
    } else {
      this.storeListings.collection = col;
    }

    if (!$.contains(this.$listingsContainer[0], this.storeListings.el)) {
      this.$listingsContainer.empty()
        .append(this.storeListings.el);
    }

    this.storeListings.render();
  }

  renderCategories(cats = this.collection.categories) {
    if (!this.categoryFilter) {
      this.categoryFilter = new CategoryFilter({
        categories: cats,
        selected: this.filter.category,
      });

      this.listenTo(this.categoryFilter, 'category-change', (e) => {
        this.filter.category = e.value;
        this.renderListings(this.filteredCollection());
      });
    } else {
      this.categoryFilter.categories = cats;
    }

    if (!$.contains(this.$catFilterContainer[0], this.categoryFilter.el)) {
      this.$catFilterContainer.empty()
        .append(this.categoryFilter.el);
    }

    this.categoryFilter.render();
  }

  render() {
    const isFetching = this.fetch && this.fetch.state() === 'pending';
    const fetchFailed = this.fetch && this.fetch.state() === 'rejected';
    const filteredLen = this.collection.length;

    loadTemplate('userPage/store.html', (t) => {
      this.$el.html(t({
        listingCountText:
          `<span class="txB"><span>${filteredLen}</span> listing` +
          `${filteredLen === 1 ? '' : 's'}</span> found`,
        isFetching,
        fetchFailed,
        fetchFailReason: this.fetch && this.fetch.state() === 'rejected' &&
          this.fetch.responseText || '',
        filter: this.filter,
      }));
    });

    this.$sortBy = this.$('.js-sortBySelect');
    this.$shipsToSelect = this.$('.js-shipsToSelect');
    this._$btnRetry = null;
    this._$listingsContainer = null;
    this._$catFilterContainer = null;

    this.$sortBy.select2({
      minimumResultsForSearch: -1,
      dropdownParent: this.$('.js-sortBySelectDropdownContainer'),
    });

    this.$shipsToSelect.select2({
      dropdownParent: this.$('.js-shipsToSelectDropdownContainer'),
    });

    if (!this.rendered && this.options.listing) {
      // if first render, show a listing if it was
      // passed in as a view option
      this.showListing(this.options.listing);
      this.rendered = true;
    }

    if (!isFetching && !fetchFailed) {
      if (this.collection.length) {
        this.renderListings(this.filteredCollection());
      }

      this.renderCategories(this.collection.categories);
    }

    return this;
  }
}
