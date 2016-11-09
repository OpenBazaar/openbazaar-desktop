import $ from 'jquery';
import 'select2';
import '../../utils/velocityUiPack.js';
import { getTranslatedCountries } from '../../data/countries';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import Listing from '../../models/listing/Listing';
import Listings from '../../collections/Listings';
import { events as listingEvents } from '../../models/listing/';
import BaseVw from '../baseVw';
import ListingDetail from '../modals/listingDetail/Listing';
import StoreListings from './StoreListings';
import CategoryFilter from './CategoryFilter';
import PopInMessage from '../PopInMessage';

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

    this.countryList = getTranslatedCountries(app.settings.get('language'));

    this.filter = {
      category: 'all',
      searchTerm: '',
      sortBy: 'PRICE_ASC',
      freeShipping: false,
    };

    this.listenTo(this.collection, 'request', this.onRequest);
    this.listenTo(this.collection, 'update', this.onUpdateCollection);

    if (this.model.id === app.profile.id) {
      this.listenTo(listingEvents, 'saved', (md, opts) => {
        // For now, we only know if the listing model has
        // changed in some way since the last save. We don't
        // know what specifically changed. So, this message
        // will show if some listing attribute changed, even
        // though it may not be one represented in the store.

        if (opts.hasChanged()) {
          this.showDataChangedMessage();
        }
      });

      this.listenTo(listingEvents, 'destroy', () => (this.showDataChangedMessage()));
    }

    this.listenTo(app.settings, 'change:country', () => (this.showShippingChangedMessage()));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, opts) => {
        if (opts.changes.merged.length) {
          // ensure any merged ones have actually changed
          const models = opts.changes.merged;

          for (let i = 0; i < models.length; i++) {
            if (models[i].hasChanged()) {
              this.showShippingChangedMessage();
              return;
            }
          }
        }

        if (opts.changes.added.length ||
          opts.changes.removed.length) {
          this.showShippingChangedMessage();
        }
      });

    // this block should be last
    if (options.initialFetch) {
      this.fetch = options.initialFetch;
      this.onRequest(this.collection, this.fetch);
    }
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && $.contains(this.el, this.dataChangePopIn.el)) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.dataChangePopIn = new PopInMessage({
        messageText: 'Listing data has changed (translate me). ' +
          '<a class="js-refresh">refresh</a>',
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.collection.fetch()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  showShippingChangedMessage() {
    if (this.shippingChangePopIn && $.contains(this.el, this.shippingChangePopIn.el)) {
      this.shippingChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.shippingChangePopIn = new PopInMessage({
        messageText: 'Your country and/or shipping address information has changed. This may' +
          ' affect which listings ship free to you. It is recommended you' +
          ' <a class="js-refresh">refresh</a> to see the latest data.',
      });

      this.listenTo(this.shippingChangePopIn, 'clickRefresh', () => (this.collection.fetch()));

      this.listenTo(this.shippingChangePopIn, 'clickDismiss', () => {
        this.shippingChangePopIn.remove();
        this.shippingChangePopIn = null;
      });

      this.$popInMessages.append(this.shippingChangePopIn.render().el);
    }
  }

  className() {
    return 'userPageStore';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
      'change .js-filterFreeShipping': 'onFilterFreeShippingChange',
      'change .js-shipsToSelect': 'onShipsToSelectChange',
      'change .js-filterShipsTo': 'onShipsToCheckBoxChange',
      'keyup .js-searchInput': 'onKeyupSearchInput',
      'change .js-sortBySelect': 'onChangeSortBy',
    };
  }

  onFilterFreeShippingChange(e) {
    this.filter.freeShipping = $(e.target).is(':checked');
    this.renderListings(this.filteredCollection());
  }

  onShipsToSelectChange(e) {
    if (this.$shipsToCheckbox.is(':checked')) {
      this.setShipsToFilter($(e.target).val());
    } else {
      this.setShipsToFilter();
    }
  }

  onShipsToCheckBoxChange(e) {
    if ($(e.target).is(':checked')) {
      this.setShipsToFilter(this.$shipsToSelect.val());
    } else {
      this.setShipsToFilter();
    }
  }

  setShipsToFilter(val) {
    if (val) {
      this.filter.shipsTo = val;
    } else {
      delete this.filter.shipsTo;
    }

    this.renderListings(this.filteredCollection());
  }

  onChangeSortBy(e) {
    this.filter.sortBy = $(e.target).val();
    this.renderListings(this.storeListings.collection);
  }

  onUpdateCollection(cl, opts) {
    if (opts.changes.added) {
      opts.changes.added.forEach((md) => {
        md.searchDescription = $('<div />').html(md.get('description'))
          .text()
          .toLocaleLowerCase();

        md.searchTitle = $('<div />').html(md.get('title'))
          .text()
          .toLocaleLowerCase();
      });
    }
  }

  onKeyupSearchInput(e) {
    // make sure they're not still typing
    if (this.searchKeyUpTimer) {
      clearTimeout(this.searchKeyUpTimer);
    }

    this.searchKeyUpTimer = setTimeout(() =>
      (this.search($(e.target).val())), 150);
  }

  onRequest(cl, xhr) {
    // Ignore a request on the ListingShort model, which happens
    // if we delete it.
    if (!(cl instanceof Listings)) return;

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

  search(term) {
    const searchTerm = term.toLocaleLowerCase();

    if (searchTerm === this.filter.searchTerm) return;

    this.filter.searchTerm = searchTerm;
    this.renderListings(this.filteredCollection());
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

  get $listingCount() {
    return this._$listingCount ||
      (this._$listingCount = this.$('.js-listingCount'));
  }

  get $shipsToCheckbox() {
    return this._$shipsToCheckbox ||
      (this._$shipsToCheckbox = this.$('.js-filterShipsTo'));
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

      const searchTerm = this.filter.searchTerm;

      if (searchTerm &&
        md.searchTitle.indexOf(searchTerm) === -1 &&
        md.searchDescription.indexOf(searchTerm) === -1) {
        passesFilter = false;
      }

      if (this.filter.shipsTo &&
        !md.shipsTo(this.filter.shipsTo)) {
        passesFilter = false;
      }

      return passesFilter;
    });

    return new Listings(models);
  }

  /**
   * Based on the sortBy filter, will appropriatally set the
   * comparator value on the given collection.
   */
  setSortFunction(col) {
    if (!col) {
      throw new Error('Please provide a collection.');
    }

    if (this.filter.sortBy) {
      if (this.filter.sortBy === 'PRICE_ASC') {
        col.comparator = (a, b) => {
          if (a.get('price').amount > b.get('price').amount) {
            return 1;
          } else if (a.get('price').amount < b.get('price').amount) {
            return -1;
          }

          return 0;
        };
      } else if (this.filter.sortBy === 'PRICE_DESC') {
        col.comparator = (a, b) => {
          if (a.get('price').amount < b.get('price').amount) {
            return 1;
          } else if (a.get('price').amount > b.get('price').amount) {
            return -1;
          }

          return 0;
        };
      } else if (this.filter.sortBy === 'NAME_ASC') {
        col.comparator = (a, b) => {
          if (a.get('title').toLocaleLowerCase() > b.get('title').toLocaleLowerCase()) {
            return 1;
          } else if (a.get('title').toLocaleLowerCase() < b.get('title').toLocaleLowerCase()) {
            return -1;
          }

          return 0;
        };
      } else if (this.filter.sortBy === 'NAME_DESC') {
        col.comparator = (a, b) => {
          if (a.get('title').toLocaleLowerCase() < b.get('title').toLocaleLowerCase()) {
            return 1;
          } else if (a.get('title').toLocaleLowerCase() > b.get('title').toLocaleLowerCase()) {
            return -1;
          }

          return 0;
        };
      }
    }
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

    this.setSortFunction(col);
    col.sort();

    if (!$.contains(this.$listingsContainer[0], this.storeListings.el)) {
      this.$listingsContainer.empty()
        .append(this.storeListings.el);
    }

    const listingCountContent =
      `<span class="txB"><span>${col.length}</span> listing` +
      `${col.length === 1 ? '' : 's'}</span> found`;
    this.$listingCount.html(listingCountContent);

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

  get $popInMessages() {
    return this._$popInMessages ||
      (this._$popInMessages = this.$('.js-popInMessages'));
  }

  render() {
    const isFetching = this.fetch && this.fetch.state() === 'pending';
    const fetchFailed = this.fetch && this.fetch.state() === 'rejected';

    loadTemplate('userPage/store.html', (t) => {
      this.$el.html(t({
        isFetching,
        fetchFailed,
        fetchFailReason: this.fetch && this.fetch.state() === 'rejected' &&
          this.fetch.responseText || '',
        filter: this.filter,
        countryList: this.countryList,
        country: this.filter.shipsTo || app.settings.get('country'),
      }));
    });

    this.$sortBy = this.$('.js-sortBySelect');
    this.$shipsToSelect = this.$('.js-shipsToSelect');
    this._$btnRetry = null;
    this._$listingsContainer = null;
    this._$catFilterContainer = null;
    this._$listingCount = null;
    this._$shipsToCheckbox = null;
    this._$popInMessages = null;

    this.$sortBy.select2({
      minimumResultsForSearch: -1,
      dropdownParent: this.$('.js-sortBySelectDropdownContainer'),
    });

    this.$shipsToSelect.select2({
      dropdownParent: this.$('.js-shipsToSelectDropdownContainer'),
      // dropdownPosition : 'below',
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
