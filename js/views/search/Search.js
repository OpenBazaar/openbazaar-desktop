import _ from 'underscore';
import $ from 'jquery';
import is from 'is_js';
import Swiper from 'swiper';
import '../../lib/select2';
import app from '../../app';
import Backbone from 'backbone';
import baseVw from '../baseVw';
import Results from './Results';
import Providers from './SearchProviders';
import Suggestions from './Suggestions';
import Category from './Category';
import SortBy from './SortBy';
import Filters from './Filters';
import UserCard from '../UserCard';
import { openSimpleMessage } from '../modals/SimpleMessage';
import ResultsCol from '../../collections/Results';
import ProviderMd from '../../models/search/SearchProvider';
import { supportedWalletCurs } from '../../data/walletCurrencies';
import defaultSearchProviders from '../../data/defaultSearchProviders';
import { selectEmojis } from '../../utils';
import loadTemplate from '../../utils/loadTemplate';
import { recordEvent } from '../../utils/metrics';
import { curConnOnTor } from '../../utils/serverConnect';
import { scrollPageIntoView } from '../../utils/dom';
import {
  searchTypes,
  createSearchURL,
} from '../../utils/search';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        fetching: false,
        tab: 'listings',
        xhr: null,
        fetchingFeatureStores: false,
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    const queryKeys = ['q', 'p', 'ps', 'sortBy'];

    // Allow router to pass in a search type for future use with vendor searches.
    const searchType = searchTypes.includes(opts.initialState.tab) ?
      opts.initialState.tab : 'listings';

    this._defaultSearch = {
      q: '*',
      p: 0,
      ps: 66,
      searchType,
      filters: {
        nsfw: String(app.settings.get('showNsfw')),
        acceptedCurrencies: supportedWalletCurs(),
      },
    };

    this._search = {
      ...this._defaultSearch,
      ..._.pick(opts, [...queryKeys, 'filters']),
    };

    // If there is only one provider and it isn't the default, just set it to be such.
    if (!this.currentDefaultProvider && app.searchProviders.length === 1) {
      this.currentDefaultProvider = app.searchProviders.at(0);
    }
    this._search.provider = this.currentDefaultProvider || app.searchProviders.at(0);

    this._categoryTerms = [
      'Art',
      'Music',
      'Toys',
      'Crypto',
      'Books',
      'Health',
      'Games',
      'Handmade',
      'Clothing',
      'Electronics',
      'Bitcoin',
    ];

    this._categorySearch = {
      ...this._search,
      ps: 8,
    };

    this._cryptoSearch = {
      ...this._categorySearch,
      ps: 5,
      filters: {
        type: 'cryptocurrency',
      },
    };

    this._categorySearches = [this._cryptoSearch];
    this._categoryTerms.forEach(cat => {
      this._categorySearches.push({ ...this._categorySearch, q: cat });
    });

    this.featureStoreIDs = [];
    this.categoryViews = [];
    this.searchFetches = [];
    this._setHistory = false; // The router has already set the history.

    // If a query was passed in from the router, extract the data from it.
    if (options.query) {
      recordEvent('Discover_SearchFromAddressBar');
      recordEvent('Discover_Search', { type: 'addressBar' });

      const queryParams = (new URL(`${this.currentBaseUrl}?${options.query}`)).searchParams;

      // If the query had a providerQ parameter, use that as the provider URL instead.
      if (queryParams.get('providerQ')) {
        const subURL = new URL(queryParams.get('providerQ'));
        queryParams.delete('providerQ');
        // The first parameter after the ? will be part of the providerQ, transfer it over.
        for (const param of subURL.searchParams.entries()) {
          queryParams.append(param[0], param[1]);
        }
        const base = `${subURL.origin}${subURL.pathname}`;
        /*
         If the query provider model doesn't already exist, create a new provider model for it.
         One quirk to note: if a tor url is passed in while the user is in clear mode, and an
         existing provider has that tor url, that provider will be activated but will use its
         clear url if it has one. The opposite is also true.
         */
        const matchedProvider = is.url(base) ? app.searchProviders.getProviderByURL(base) : '';
        if (!matchedProvider) {
          this._search.provider = new ProviderMd();
          /*
           We don't actually know what type of search the url is for, we'll assume for example a
           user in tor mode is only pasting in a tor url. If there is a mismatch, the correct
           values will be saved after the endpoint returns them.
           */
          const searchAttribute = `${curConnOnTor() ? 'tor' : ''}${this._search.searchType}`;
          this._search.provider.set(searchAttribute, base);
          if (!this._search.provider.isValid()) {
            openSimpleMessage(app.polyglot.t('search.errors.invalidUrl'));
            this._search.provider = app.searchProviders.at(0);
            recordEvent('Discover_InvalidQueryProvider', { url: base });
          }
        } else {
          this._search.provider = matchedProvider;
        }
      }

      const params = {};

      for (const key of queryParams.keys()) {
        // checkbox params are represented by the same key multiple times. Convert them into a
        // single key with an array of values
        const val = queryParams.getAll(key);
        params[key] = val.length === 1 ? val[0] : val;
      }

      // set the params in the search object
      const filters = { ...this._search.filters, ..._.omit(params, [...queryKeys]) };

      this.setSearch({ ..._.pick(params, ...queryKeys), filters }, { force: true });
    } else {
      if (this._search.provider.id === defaultSearchProviders[0].id) {
        this.buildCategories();
      } else {
        this.setSearch({}, { force: true, tab: 'home' });
      }
    }
  }

  className() {
    return 'search';
  }

  events() {
    return {
      'click .js-searchBtn': 'clickSearchBtn',
      'keyup .js-searchInput': 'onKeyupSearchInput',
      'click .js-deleteProvider': 'clickDeleteProvider',
      'click .js-makeDefaultProvider': 'clickMakeDefaultProvider',
      'click .js-addQueryProvider': 'clickAddQueryProvider',
    };
  }

  isExistingProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }
    return !!app.searchProviders.getProviderByURL(md[`${this._search.searchType}Url`]);
  }

  get currentDefaultProvider() {
    return app.searchProviders.defaultProvider;
  }

  set currentDefaultProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }

    app.searchProviders[`default${curConnOnTor() ? 'Tor' : ''}Provider`] = md;
  }

  get currentBaseUrl() {
    return this._search.provider[`${this._search.searchType}Url`];
  }

  providerIsADefault(id) {
    return !!_.findWhere(defaultSearchProviders, { id });
  }

  /** Updates the search object. If updated, triggers a search fetch.
   *
   * @param {object} search - The new state.
   * @param {boolean} opts.force - Should search be fired even if nothing changed?
   */
  setSearch(search = {}, opts = {}) {
    const newSearch = {
      ...this._search,
      ...search,
    };

    if (!_.isEqual(this._search, newSearch) || opts.force) {
      this._search = newSearch;
      scrollPageIntoView();
      if (opts.tab) {
        this.fetchSearch(this._search, opts.tab);
      } else {
        this.fetchSearch(this._search);
      }
    }
  }

  /**
   * Creates an object for updating search providers with new data returned from a query.
   * @param {object} data - Provider object from a search query.
   * @returns {{data: *, urlTypes: Array}}
   */
  buildProviderUpdate(data) {
    const update = {};
    const urlTypes = [];

    if (data.name && is.string(data.name)) update.name = data.name;
    if (data.logo && is.url(data.logo)) update.logo = data.logo;
    if (data.links) {
      if (is.url(data.links.featureStores)) {
        update.featureStores = data.links.featureStores;
        urlTypes.push('featureStores');
      }
      if (is.url(data.links.vendors)) {
        update.vendors = data.links.vendors;
        urlTypes.push('vendors');
      }
      if (is.url(data.links.listings)) {
        update.listings = data.links.listings;
        urlTypes.push('listings');
      }
      if (is.url(data.links.reports)) {
        update.reports = data.links.reports;
        urlTypes.push('reports');
      }
      if (data.links.tor) {
        if (is.url(data.links.tor.listings)) {
          update.torListings = data.links.tor.listings;
          urlTypes.push('torlistings');
        }
        if (is.url(data.links.tor.vendors)) {
          update.torVendors = data.links.tor.vendors;
          urlTypes.push('torVendors');
        }
        if (is.url(data.links.tor.reports)) {
          update.torReports = data.links.tor.reports;
          urlTypes.push('torReports');
        }
      }
    }

    return {
      update,
      urlTypes,
    };
  }

  fetchSearch(opts = {}, tab = 'listings') {
    this.removeFetches();

    this.setState({
      tab,
      fetching: true,
      xhr: null,
    });

    const searchFetch = $.get({
      url: createSearchURL(opts),
      dataType: 'json',
    })
      .done((data, status, xhr) => {
        // make sure minimal data is present. If it isn't, it's probably an invalid endpoint.
        if (data.name && data.links) {
          const dataUpdate = this.buildProviderUpdate(data);
          let tabUpdated = tab;

          // update the defaults but do not save them
          if (!this.providerIsADefault(this._search.provider.id)) {
            this._search.provider.save(dataUpdate.update, { urlTypes: dataUpdate.urlTypes });
            if (dataUpdate.update.featureStores) {
              this.fetchFeatureStores();
              this.buildCategories();
            } else {
              tabUpdated = 'listings';
            }
          } else {
            this._search.provider.set(dataUpdate.update, { urlTypes: dataUpdate.urlTypes });
          }

          this.setState({
            tab: tabUpdated,
            fetching: false,
            data,
          });
          // After either the first search or the first category load completes, set the history.
          this._setHistory = true;
        } else {
          this.setState({
            fetching: false,
            data: {},
            xhr,
          });
        }
      })
      .fail((xhr) => {
        if (xhr.statusText !== 'abort') {
          this.setState({
            fetching: false,
            data: {},
            xhr,
          });
        }
      });

    this.searchFetches.push(searchFetch);
  }

  /**
   * This will activate a provider. If no default is set, the activated provider will be set as the
   * the default. If the user is currently in Tor mode, the default Tor provider will be set.
   * @param {object} md - the search provider model
   */
  activateProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }
    if (app.searchProviders.indexOf(md) === -1) {
      throw new Error('The provider must be in the collection.');
    }

    if (!this.currentDefaultProvider) this.makeDefaultProvider(md);

    const force = md.id !== this._search.provider.id;
    if (force) {
      this._search.provider = md;

      this._categorySearches.forEach(catSearch => {
        catSearch.provider = this._search.provider;
      });

      this.categoryViews = [];
    }

    if (md.id === defaultSearchProviders[0].id) {
      this.buildCategories();
    } else if (md.get('featureStores')) {
      this.fetchFeatureStores();
      this.buildCategories();
    } else {
      this.setSearch({ provider: md, p: 0 }, { force, tab: 'home' });
    }
  }

  deleteProvider(md = this._search.provider) {
    // Default providers shouldn't show an option to trigger this.
    if (!this.providerIsADefault(md.id)) {
      md.destroy();
      if (app.searchProviders.length) this.activateProvider(app.searchProviders.at(0));
    }
  }

  clickDeleteProvider() {
    recordEvent('Discover_DeleteProvider', {
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
    });
    this.deleteProvider();
  }

  makeDefaultProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }
    if (app.searchProviders.indexOf(md) === -1) {
      throw new Error('The provider to be made the default must be in the collection.');
    }

    this.currentDefaultProvider = md;
  }

  clickMakeDefaultProvider() {
    recordEvent('Discover_MakeDefaultProvider', {
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
    });
    this.makeDefaultProvider(this._search.provider);
    this.render();
  }

  addQueryProvider() {
    if (!this.isExistingProvider(this._search.provider)) {
      app.searchProviders.add(this._search.provider);
      this.render();
    }
  }

  clickAddQueryProvider() {
    this.addQueryProvider();
  }

  fetchFeatureStores() {
    this.setState({ fetchingFeatureStores: true });
    $.get({
      url: this._search.provider.get('featureStores'),
      dataType: 'json',
    })
      .done((data) => { this.featureStoreIDs = data; })
      .always(() => (this.setState({ fetchingFeatureStores: false })));
  }

  /**
   * This will add the categories one by one in a loop. If the category views already exist, they
   * will be reused to prevent new calls to the search endpoint.
   */
  buildCategories() {
    if (!Array.isArray(this._categorySearches)) {
      throw new Error('this._categorySearches should be a valid array of search objects.');
    }

    if (this.categoryViews.length === this._categorySearches.length) {
      app.router.navigate('search');
      // After either the first search or the first category load completes, set the history.
      this._setHistory = true;
      this._search = { ...this._defaultSearch, provider: this._search.provider };
      scrollPageIntoView();
      const data = { name: this._search.provider.name, logo: this._search.provider.logo };
      // The state may not be changed here, so always fire a render.
      this.setState({ tab: 'home', data }, { renderOnChange: false });
      this.render();
      return;
    }

    const search = this._categorySearches[this.categoryViews.length];
    const categoryVw = this.createChild(Category, {
      search,
      viewType: search.filters.type === 'cryptocurrency' ? 'cryptoList' : 'grid',
    });
    this.categoryViews.push(categoryVw);

    this.listenTo(categoryVw, 'seeAllCategory', (opts) => this.setSearch(opts));
    this.buildCategories();
  }

  /**
   * This will create a results view from the provided search data.
   * @param {object} data - JSON results from a search endpoint.
   * @param {object} search - A valid search object.
   * @param {boolean} setHistory - Whether the results should save the query to history.
   */
  createResults(data = {}, search, setHistory = true) {
    if (!search || $.isEmptyObject(search)) throw new Error('Please provide a search object.');

    this.resultsCol = new ResultsCol();
    this.resultsCol.add(this.resultsCol.parse(data));

    let viewType = 'grid';

    if (data.options && data.options.type &&
      data.options.type.options &&
      data.options.type.options.length) {
      if (data.options.type.options.find(op => op.value === 'cryptocurrency' && op.checked) &&
        data.options.type.options.filter(op => op.checked).length === 1) {
        viewType = 'cryptoList';
      }
    }

    if (this.resultsView) this.resultsView.remove();
    this.resultsView = this.createChild(Results, {
      search,
      total: data.results ? data.results.total : 0,
      morePages: data.results ? data.results.morePages : false,
      initCol: this.resultsCol,
      viewType,
      setHistory,
    });

    recordEvent('Discover_Results', {
      total: data.results ? data.results.total : 0,
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
      page: this._search.p + 1,
    });

    this.getCachedEl('.js-resultsWrapper').html(this.resultsView.render().el);

    this.listenTo(this.resultsView, 'searchError', xhr => {
      this.setState({
        fetching: false,
        data: {},
        xhr,
      });
    });
    this.listenTo(this.resultsView, 'loadingPage', () => scrollPageIntoView());
    this.listenTo(this.resultsView, 'resetSearch', () => this.setSearch(this._defaultSearch));
  }

  clickSearchBtn() {
    this.setSearch({ q: this.getCachedEl('.js-searchInput').val(), p: 0 }, { force: true });
    recordEvent('Discover_ClickSearch');
    recordEvent('Discover_Search', { type: 'click' });
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.setSearch({ q: this.getCachedEl('.js-searchInput').val(), p: 0 }, { force: true });
      recordEvent('Discover_EnterKeySearch');
      recordEvent('Discover_Search', { type: 'enterKey' });
    }
  }

  changeSortBy(opts) {
    this.setSearch({ ...opts, p: 0 });
    recordEvent('Discover_ChangeSortBy');
  }

  onFilterChanged() {
    this.setSearch({ filters: this.filters.retrieveFormData(), p: 0 });
    recordEvent('Discover_ChangeFilter');
  }

  onClickSuggestion(opts) {
    this.setSearch({ q: opts.suggestion, p: 0, filters: { type: 'all' } });
    recordEvent('Discover_ClickSuggestion');
    recordEvent('Discover_Search', { type: 'suggestion' });
  }

  removeFetches() {
    this.searchFetches.forEach(fetch => fetch.abort());
  }

  remove() {
    this.removeFetches();
    this.categoryViews.forEach(cat => cat.remove());
    super.remove();
  }

  renderFeatureStores() {
    if (this.featureStoreIDs.length == 0) {
      return;
    }

    const UserCardSwiper = Backbone.View.extend({
      className: 'swiper-slide',
      initialize: function (options) {
        _.extend(this, _.pick(options, "guid"));
      },
      render: function () {
        const view = new UserCard({ guid: this.guid });
        this.$el.append(view.render().el);
        return this;
      },
    });

    const usersFrag = document.createDocumentFragment();
    this.featureStoreIDs.forEach(storeID => {
      const view = new UserCardSwiper({ guid: storeID });
      view.render().$el.appendTo(usersFrag);
    });

    this.getCachedEl('.swiper-wrapper').html(usersFrag);

    this._swiper = new Swiper(this.getCachedEl('.swiper-container'), {
      slidesPerView: 3,
      spaceBetween: 10,
      autoplay: true,
    });
  }

  renderCategories() {
    const catsFrag = document.createDocumentFragment();

    this.categoryViews.forEach(catVw => {
      catVw.delegateEvents();
      catVw.render().$el.appendTo(catsFrag);
    });

    this.getCachedEl('.js-categoryWrapper').html(catsFrag);
  }

  render() {
    super.render();
    const state = this.getState();
    const data = state.data || {};
    const term = this._search.q === '*' ? '' : this._search.q;
    const hasFilters = data.options && !$.isEmptyObject(data);

    let errTitle;
    let errMsg;

    if (state.xhr) {
      const provider = this._search.provider.get('name') || this.currentBaseUrl;
      errTitle = app.polyglot.t('search.errors.searchFailTitle', { provider });
      const failReason = state.xhr.responseJSON ? state.xhr.responseJSON.reason : '';
      errMsg = failReason ?
        app.polyglot.t('search.errors.searchFailReason', { error: failReason }) :
        app.polyglot.t('search.errors.searchFailData');
    }

    loadTemplate('search/search.html', (t) => {
      this.$el.html(t({
        term,
        errTitle,
        errMsg,
        showFeatureStores: state.tab === 'home' && !!this._search.provider.get('featureStores'),
        providerLocked: this.providerIsADefault(this._search.provider.id),
        isExistingProvider: this.isExistingProvider(this._search.provider),
        showMakeDefault: this._search.provider !== this.currentDefaultProvider,
        showDataError: $.isEmptyObject(data) && state.tab === 'listings',
        hasFilters,
        ...state,
        ...data,
      }));
    });

    const $filterWrapper = this.$('.js-filterWrapper');
    const $searchLogo = this.$('.js-searchLogo');

    $searchLogo.find('img').on('error', () => {
      $searchLogo.addClass('loadError');
    });

    if (this.searchProviders) this.searchProviders.remove();
    this.searchProviders = this.createChild(Providers, {
      searchType: this._search.searchType,
      currentID: this._search.provider.id,
      showSelectDefault: !this.currentDefaultProvider,
    });
    this.listenTo(this.searchProviders, 'activateProvider', pOpts => this.activateProvider(pOpts));
    this.$('.js-searchProviders').append(this.searchProviders.render().el);

    if (this.suggestions) this.suggestions.remove();
    this.suggestions = this.createChild(Suggestions);
    this.listenTo(this.suggestions, 'clickSuggestion', opts => this.onClickSuggestion(opts));
    this.$('.js-suggestions').append(this.suggestions.render().el);

    if (this.filters) this.filters.remove();
    if (this.sortBy) this.sortBy.remove();

    if (state.tab === 'home') {
      if (this._search.provider.get('featureStores')) {
        this.renderFeatureStores();
      }
      this.renderCategories();
    } else if (state.tab === 'listings') {
      if (hasFilters) {
        this.filters = this.createChild(Filters, { initialState: { filters: data.options } });
        this.listenTo(this.filters, 'filterChanged', opts => this.onFilterChanged(opts));
        $filterWrapper.append(this.filters.render().el);

        $filterWrapper.find('select').select2({
          minimumResultsForSearch: 10,
          templateResult: selectEmojis,
          templateSelection: selectEmojis,
        });
      }

      this.sortBy = this.createChild(SortBy, {
        initialState: {
          term,
          results: data.results,
          sortBy: data.sortBy,
          sortBySelected: this._search.sortBy,
        },
      });
      this.listenTo(this.sortBy, 'changeSortBy', opts => this.changeSortBy(opts));
      this.$('.js-sortByWrapper').append(this.sortBy.render().el);

      // Use the initial set of results data to create the results view.
      this.createResults(data, this._search, this._setHistory);
    }

    this.$filters = $filterWrapper.find('select, input');

    return this;
  }
}
