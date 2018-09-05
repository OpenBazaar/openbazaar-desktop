import _ from 'underscore';
import $ from 'jquery';
import '../../lib/select2';
import '../../utils/lib/velocityUiPack.js';
import { getTranslatedCountries } from '../../data/countries';
import app from '../../app';
import { getContentFrame } from '../../utils/selectors';
import loadTemplate from '../../utils/loadTemplate';
import { convertCurrency, NoExchangeRateDataError } from '../../utils/currency';
import { launchSettingsModal } from '../../utils/modalManager';
import Listing from '../../models/listing/Listing';
import Listings from '../../collections/Listings';
import { events as listingEvents } from '../../models/listing/';
import BaseVw from '../baseVw';
import ListingDetail from '../modals/listingDetail/Listing';
import ListingsGrid, { LISTINGS_PER_PAGE } from './ListingsGrid';
import CategoryFilter from './CategoryFilter';
import TypeFilter from './TypeFilter';
import PopInMessage, { buildRefreshAlertMessage } from '../components/PopInMessage';
import { localizeNumber } from '../../utils/number';

class Store extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.countryList = getTranslatedCountries();

    this.defaultFilter = {
      category: 'all',
      type: 'all',
      shipsTo: 'any',
      searchTerm: '',
      sortBy: 'PRICE_ASC',
      freeShipping: false,
    };

    this.filter = { ...this.defaultFilter };

    this.listingsViewType = app.localSettings.get('listingsGridViewType');

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
      // if the user changes their vendor setting, toggle the warning
      this.listenTo(app.profile, 'change:vendor', () => (this.toggleInactiveWarning()));
    }

    this.listenTo(app.settings, 'change:country', () => (this.showShippingChangedMessage()));
    this.listenTo(app.settings, 'change:localCurrency', () => (this.showDataChangedMessage()));
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => (this.showDataChangedMessage()));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, opts) => {
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

  className() {
    return 'userPageStore';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
      'change .js-filterFreeShipping': 'onFilterFreeShippingChange',
      'change .js-shipsToSelect': 'onShipsToSelectChange',
      'keyup .js-searchInput': 'onKeyupSearchInput',
      'change .js-sortBySelect': 'onChangeSortBy',
      'click .js-toggleListGridView': 'onClickToggleListGridView',
      'click .js-clearSearch': 'onClickClearSearch',
      'click .js-activateStore': 'onClickActivateStore',
    };
  }

  onFilterFreeShippingChange(e) {
    this.filter.freeShipping = $(e.target).is(':checked');
    this.renderListings(this.filteredCollection());
  }

  toggleInactiveWarning() {
    this.$inactiveWarning.toggleClass('hide', app.settings.get('vendor'));
  }

  onShipsToSelectChange(e) {
    this.filter.shipsTo = e.target.value;
    this.renderListings(this.filteredCollection());
  }

  onChangeSortBy(e) {
    this.filter.sortBy = $(e.target).val();
    this.renderListings();
  }

  onUpdateCollection(cl, opts) {
    if (opts.changes.added) {
      opts.changes.added.forEach((md) => {
        md.searchDescription = $('<div />').html(md.get('description'))
          .text()
          .toLocaleLowerCase();
        md.searchTitle = md.get('title').toLocaleLowerCase();
        const price = md.get('price');

        if (price.amount !== undefined) {
          // An undefined price means it was likely an unrecognized currency that we
          // weren't able to convert from decimal/base units to integer/non-base units.
          try {
            md.convertedPrice = convertCurrency(price.amount, price.currencyCode,
              app.settings.get('localCurrency'));
          } catch (e) {
            if (e instanceof NoExchangeRateDataError) {
              // If no exchange rate data is available, we'll just use the unconverted price
              md.convertedPrice = price.amount;
            } else {
              throw e;
            }
          }
        }
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
      if (xhr.state() === 'rejected' && xhr.status !== 404) {
        // if fetch is triggered by retry button and
        // it immediately fails, it looks like nothing happend,
        // so, we'll make sure it takes a minimum time.
        const callTime = Date.now() - startTime;

        if (callTime < 250) {
          setTimeout(() => {
            this.retryPressed = false;
            this.render();
          }, 250 - callTime);
        } else {
          this.retryPressed = false;
          this.render();
        }
      } else {
        this.retryPressed = false;
        this.render();
      }
    });
  }

  onClickRetryFetch() {
    this.retryPressed = true;
    this.fetchListings();
    this.$btnRetry.addClass('processing');
  }

  onClickClearSearch() {
    // will reset filters / search text, but maintain sort
    this.filter = {
      ...this.defaultFilter,
      sortBy: this.filter.sortBy,
    };

    this.render();
  }

  onClickToggleListGridView() {
    this.listingsViewType = this.listingsViewType === 'list' ? 'grid' : 'list';
  }

  onClickActivateStore() {
    launchSettingsModal({ initialTab: 'Store' });
  }

  get listingsViewType() {
    return this._listingsViewType;
  }

  set listingsViewType(type) {
    if (['list', 'grid'].indexOf(type) === '-1') {
      throw new Error('The type provided is not one of the available types.');
    }

    const prevType = this._listingsViewType;
    this._listingsViewType = type;

    if (prevType) {
      if (prevType !== this._listingsViewType) {
        this.$el.toggleClass('listView');

        if (this.storeListings) {
          this.renderListings(this.fullRenderedCollection);
        }
      }
    } else if (type === 'list') {
      this.$el.addClass('listView');
    }
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('userPage.store.listingDataChangedPopin')),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.fetchListings()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  showShippingChangedMessage() {
    if (this.shippingChangePopIn && !this.shippingChangePopIn.isRemoved()) {
      this.shippingChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.shippingChangePopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('userPage.store.shippingDataChangedPopin')),
      });

      this.listenTo(this.shippingChangePopIn, 'clickRefresh', () => (this.fetchListings()));

      this.listenTo(this.shippingChangePopIn, 'clickDismiss', () => {
        this.shippingChangePopIn.remove();
        this.shippingChangePopIn = null;
      });

      this.$popInMessages.append(this.shippingChangePopIn.render().el);
    }
  }

  fetchListings(options = {}) {
    Store.fetchListings(this.collection, options);
  }

  search(term) {
    const searchTerm = term.toLocaleLowerCase()
      .trim();

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
      profile: this.model,
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
    return this.getCachedEl('.js-retryFetch');
  }

  get $listingsContainer() {
    return this.getCachedEl('.js-listingsContainer');
  }
  get $shippingFilterContainer() {
    return this.getCachedEl('.js-shippingFilterContainer');
  }

  get $catFilterContainer() {
    return this.getCachedEl('.js-catFilterContainer');
  }

  get $typeFilterContainer() {
    return this.getCachedEl('.js-typeFilterContainer');
  }

  get $listingCount() {
    return this.getCachedEl('.js-listingCount');
  }

  get $noResults() {
    return this.getCachedEl('.js-noResults') || null;
  }

  get $popInMessages() {
    return this.getCachedEl('.js-popInMessages');
  }

  get $inactiveWarning() {
    return this.getCachedEl('.js-inactiveWarning');
  }

  filteredCollection(filter = this.filter, collection = this.collection) {
    const models = collection.models.filter((md) => {
      let passesFilter = true;

      if (this.filter.freeShipping && !md.shipsFreeToMe) {
        passesFilter = false;
      }

      if (this.filter.category !== 'all' &&
        md.get('categories').indexOf(this.filter.category) === -1) {
        passesFilter = false;
      }

      if (this.filter.type !== 'all' &&
        md.get('contractType') !== this.filter.type) {
        passesFilter = false;
      }

      const searchTerm = this.filter.searchTerm;

      if (searchTerm &&
        md.searchTitle.indexOf(searchTerm) === -1 &&
        md.searchDescription.indexOf(searchTerm) === -1) {
        passesFilter = false;
      }

      if (this.filter.shipsTo !== 'any' &&
        !md.shipsTo(this.filter.shipsTo)) {
        passesFilter = false;
      }

      return passesFilter;
    });

    return new Listings(models, { guid: this.model.id });
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
          if (a.convertedPrice > b.convertedPrice) {
            return 1;
          } else if (a.convertedPrice < b.convertedPrice) {
            return -1;
          }

          return 0;
        };
      } else if (this.filter.sortBy === 'PRICE_DESC') {
        col.comparator = (a, b) => {
          if (a.convertedPrice < b.convertedPrice) {
            return 1;
          } else if (a.convertedPrice > b.convertedPrice) {
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

  storeListingsScroll(paginatedCol, e) {
    // Make sure we're in the DOM (i.e. the store tab is active).
    if (!this.el.parentElement) return;

    // if we've scrolled within a 150px of the bottom
    if (e.target.scrollTop + $(e.target).innerHeight() >= e.target.scrollHeight - 150) {
      paginatedCol.add(
        this.fullRenderedCollection.slice(this.storeListings.listingCount,
          this.storeListings.listingCount + LISTINGS_PER_PAGE)
      );
    }
  }

  renderListings(col = this.fullRenderedCollection) {
    if (!col) {
      throw new Error('Please provide a collection.');
    }

    // This collection will be loaded in batches as the
    // user scrolls.
    this.fullRenderedCollection = col;
    this.setSortFunction(col);
    col.sort();

    this.$listingsContainer.empty();

    const countPhrase = app.polyglot.t('userPage.store.countListings',
     { smart_count: col.length, display_count: localizeNumber(col.length) });

    const fullListingCount =
        app.polyglot.t('userPage.store.countListingsFound',
          { countListings: `<span class="txB">${countPhrase}</span>` });
    this.$listingCount.html(fullListingCount);

    if (col.length) {
      // todo: exceptionally tall screens may fit an entire page
      // with room to spare. Which means no scrollbar, which means subsequent
      // pages will not load. Handle that case.
      const storeListingsCol =
        new Listings(col.slice(0, LISTINGS_PER_PAGE), { guid: this.model.id });

      if (this.storeListings) this.storeListings.remove();

      this.storeListings = new ListingsGrid({
        collection: storeListingsCol,
        storeOwnerProfile: this.model,
        viewType: this.listingsViewType,
      });

      getContentFrame().on('scroll', this.storeListingsScrollHandler);
      const scrollHandler = e => this.storeListingsScroll.call(this, storeListingsCol, e);
      this.storeListingsScrollHandler = _.debounce(scrollHandler, 100);
      getContentFrame().on('scroll', this.storeListingsScrollHandler);

      this.$noResults.addClass('hide');
      this.$listingsContainer.append(this.storeListings.render().el);
    } else {
      this.$noResults.removeClass('hide');
    }
  }

  renderCategories(cats = this.collection.categories) {
    if (!this.categoryFilter) {
      this.categoryFilter = new CategoryFilter({
        initialState: {
          categories: cats,
          selected: this.filter.category,
        },
      });

      this.categoryFilter.render();

      this.listenTo(this.categoryFilter, 'category-change', (e) => {
        this.filter.category = e.value;
        this.renderListings(this.filteredCollection());
      });
    } else {
      if (cats.indexOf(this.filter.category) === -1) {
        this.filter.category = 'all';
      }

      this.categoryFilter.setState({
        categories: cats,
        selected: this.filter.category,
      });
    }

    if (!this.$catFilterContainer[0].contains(this.categoryFilter.el)) {
      this.categoryFilter.delegateEvents();
      this.$catFilterContainer.empty()
        .append(this.categoryFilter.el);
    }
  }

  renderTypes(types = this.collection.types) {
    if (!this.typeFilter) {
      this.typeFilter = new TypeFilter({
        initialState: {
          types,
          selected: this.filter.type,
        },
      });

      this.typeFilter.render();

      this.listenTo(this.typeFilter, 'type-change', (e) => {
        this.filter.type = e.value;

        if (this.filter.type !== 'PHYSICAL_GOOD' && this.filter.type !== 'all') {
          this.$shippingFilterContainer.addClass('disabled');
        } else {
          this.$shippingFilterContainer.removeClass('disabled');
        }

        this.renderListings(this.filteredCollection());
      });
    } else {
      if (types.indexOf(this.filter.type) === -1) {
        this.filter.type = 'all';
      }

      this.typeFilter.setState({
        types,
        selected: this.filter.type,
      });
    }

    if (!this.$typeFilterContainer[0].contains(this.typeFilter.el)) {
      this.typeFilter.delegateEvents();
      this.$typeFilterContainer.empty()
        .append(this.typeFilter.el);
    }
  }

  remove() {
    getContentFrame().off('scroll', this.storeListingsScrollHandler);
    super.remove();
  }

  render() {
    super.render();

    if (this.dataChangePopIn) this.dataChangePopIn.remove();
    if (this.shippingChangePopIn) this.shippingChangePopIn.remove();

    const isFetching = this.fetch && this.fetch.state() === 'pending';
    const fetchFailed = this.fetch && this.fetch.state() === 'rejected'
      && this.fetch.status !== 404;

    loadTemplate('userPage/store.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        isFetching,
        fetchFailed,
        fetchFailReason: fetchFailed && this.fetch.responseJSON
          && this.fetch.responseJSON.reason || '',
        filter: this.filter,
        countryList: this.countryList,
        shipsToSelected: this.filter.shipsTo || 'any',
        listingCount: this.collection.length,
      }));
    });

    this.$sortBy = this.$('.js-sortBySelect');
    this.$shipsToSelect = this.$('.js-shipsToSelect');

    this.$sortBy.select2({
      minimumResultsForSearch: -1,
      dropdownParent: this.$('.js-sortBySelectDropdownContainer'),
    });

    this.$shipsToSelect.select2({
      dropdownParent: this.$('.js-shipsToSelectDropdownContainer'),
    });

    if (!this.rendered) {
      if (this.options.listing) {
        // if first render, show a listing if it was
        // passed in as a view option
        this.showListing(this.options.listing);
      }

      this.rendered = true;
    }

    if (!isFetching && !fetchFailed) {
      this.renderCategories(this.collection.categories);
      this.renderTypes(this.collection.types);

      if (this.collection.length) {
        this.renderListings(this.filteredCollection());
      }
    }

    return this;
  }
}

Store.fetchListings = (cl, options = {}) =>
  cl.fetch({ cache: false, ...options });

export default Store;
