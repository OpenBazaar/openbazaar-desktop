import _ from 'underscore';
import $ from 'jquery';
import is from 'is_js';
import '../../lib/select2';
import app from '../../app';
import baseVw from '../baseVw';
import Results from './Results';
import Providers from './SearchProviders';
import Suggestions from './Suggestions';
import Category from './Category';
import SortBy from './SortBy';
import Filters from './Filters';
import { openSimpleMessage } from '../modals/SimpleMessage';
import ResultsCol from '../../collections/Results';
import ProviderMd from '../../models/search/SearchProvider';
import { supportedWalletCurs } from '../../data/walletCurrencies';
import defaultSearchProviders from '../../data/defaultSearchProviders';
import { selectEmojis } from '../../utils';
import loadTemplate from '../../utils/loadTemplate';
import { recordEvent } from '../../utils/metrics';
import { getCurrentConnection } from '../../utils/serverConnect';
import { capitalize } from '../../utils/string';
import { scrollPageIntoView } from '../../utils/dom';
import {
  createSearchURL,
  fetchSearchResults,
  sanitizeResults,
  buildProviderUpdate,
} from '../../utils/search';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        fetching: false,
        showHome: false,
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    const queryKeys = ['q', 'p', 'ps', 'sortBy', 'network'];

    this._defaultSearch = {
      urlType: 'listingsUrl',
      q: '*',
      p: 0,
      ps: 66,
      filters: {
        nsfw: String(app.settings.get('showNsfw')),
        acceptedCurrencies: supportedWalletCurs(),
      },
    };

    this._search = {
      ...this._defaultSearch,
      ..._.pick(opts, [...queryKeys, 'urlType', 'filters']),
    };

    // If there is only one provider and it isn't the default, just set it to be such.
    if (!this.currentDefaultProvider && app.searchProviders.length === 1) {
      this.currentDefaultProvider = app.searchProviders.at(0);
    }
    this._search.provider = this.currentDefaultProvider;

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

    this.categories = [];

    this.searchFetches = [];

    this.usingTor = app.serverConfig.tor && getCurrentConnection().server.get('useTor');

    // In the future there may be more possible types
    this.urlType = this.usingTor ? 'torlistings' : 'listings';

    // If a query was passed in from the router, extract the data from it.
    if (options.query) {
      recordEvent('Discover_SearchFromAddressBar');
      recordEvent('Discover_Search', { type: 'addressBar' });

      let queryParams = (new URL(`${this.currentBaseUrl}?${options.query || ''}`)).searchParams;

      // If the query had a providerQ parameter, use that as the provider URL instead.
      if (queryParams.get('providerQ')) {
        const subURL = new URL(queryParams.get('providerQ'));
        queryParams = subURL.searchParams;
        const base = `${subURL.origin}${subURL.pathname}`;
        /* if the query provider model doesn't already exist, create a new provider model for it.
         One quirk to note: if a tor url is passed in while the user is in clear mode, and an
         existing provider has that tor url, that provider will be activated but will use its
         clear url if it has one. The opposite is also true.
         */
        const matchedProvider = app.searchProviders.getProviderByURL(base);
        if (!matchedProvider) {
          this._search.provider = new ProviderMd();
          this._search.provider.set(this.urlType, base);
          if (!this._search.provider.isValid()) {
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
      const filters = _.omit(params, [...queryKeys]);

      // if the  provider returns a bad URL, change to a known good default provider
      if (is.not.url(this.currentBaseUrl)) {
        this._search.provider = app.searchProviders.at(0);
        recordEvent('Discover_InvalidDefaultProvider', { url: this.currentBaseUrl });
      }

      this.setSearch({ ..._.pick(params, ...queryKeys), filters });
    } else {
      // If the user has OB1 set as default, show the Discover default UX. If they don't, show a
      // default search using their default provider.
      if (this.usingOriginal) {
        this.setState({ showHome: true });
      } else {
        this.fetchSearch(this._search);
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
      'click .js-addQueryProvider': 'clickAddProvider',
    };
  }

  doesProviderURLExist(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }
    return !!app.searchProviders.getProviderByURL(md[this._search.urlType]);
  }

  get torString() {
    return `default${this.usingTor ? 'Tor' : ''}Provider`;
  }

  get currentDefaultProvider() {
    return app.searchProviders[this.torString];
  }

  set currentDefaultProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }

    app.searchProviders[this.torString] = md;
  }

  get currentBaseUrl() {
    return this._search.provider[this._search.urlType];
  }

  get usingOriginal() {
    return this._search.provider.id === defaultSearchProviders[0].id;
  }

  providerIsADefault(id) {
    return !!_.findWhere(defaultSearchProviders, { id });
  }

  /** Handles updates to the search.
   *
   * @param {object} search - The new state.
   */
  setSearch(search = {}) {
    const newSearch = {
      ...this._search,
      ...search,
    };

    if (!_.isEqual(this._search, newSearch)) {
      this._search = newSearch;
      this.fetchSearch(this._search);
    }
  }

  fetchSearch(opts = {}) {
    opts.baseUrl = opts.baseUrl || this.currentBaseUrl;

    this.removeFetches();

    this.setState({
      showHome: false,
      fetching: true,
      xhr: '',
    });

    const searchFetch = fetchSearchResults(createSearchURL(opts))
      .done((pData, status, xhr) => {
        const data = JSON.parse(sanitizeResults(pData));

        // make sure minimal data is present. If it isn't, it's probably an invalid endpoint.
        if (data.name && data.links) {
          const dataUpdate = buildProviderUpdate(data);

          // update the defaults but do not save them
          if (!this.providerIsADefault(this._search.provider.id)) {
            this._search.provider.save(dataUpdate.update, { urlTypes: dataUpdate.urlTypes });
          } else {
            this._search.provider.set(dataUpdate.update, { urlTypes: dataUpdate.urlTypes });
          }

          this.setState({
            fetching: false,
            data,
          });
        } else {
          this.setState({
            fetching: false,
            data: '',
            xhr,
          });
        }
      })
      .fail((xhr) => {
        if (xhr.statusText !== 'abort') {
          this.setState({
            fetching: false,
            data: '',
            xhr,
          });
        }
      });

    this.searchFetches.push(searchFetch);
  }

  /**
   * This will activate a provider. If no default is set, the activated provider will be set as the
   * the default. If the user is currently in Tor mode, the default Tor provider will be set.
   * @param md the search provider model
   */
  activateProvider(md) {
    if (!md || !(md instanceof ProviderMd)) {
      throw new Error('Please provide a search provider model.');
    }
    if (app.searchProviders.indexOf(md) === -1) {
      throw new Error('The provider must be in the collection.');
    }
    this.setSearch({ provider: md, p: 0 });
    if (!this.currentDefaultProvider) this.makeDefaultProvider(md);
  }

  deleteProvider(md = this._search.provider) {
    if (this.providerIsADefault(md.id)) {
      openSimpleMessage(app.polyglot.t('search.errors.locked'));
      recordEvent('Discover_DeleteLocked', {
        provider: md.get('name') || 'unknown',
        url: md.get('listings'),
      });
    } else {
      md.destroy();
      if (app.searchProviders.length) this.activateProvider(app.searchProviders.at(0));
    }
  }

  resetSearch() {
    this.setSearch(this._defaultSearch);
  }

  clickDeleteProvider() {
    recordEvent('Discover_DeleteProvider', {
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
    });
    this.deleteProvider();
  }

  makeDefaultProvider(md) {
    if (app.searchProviders.indexOf(md) === -1) {
      throw new Error('The provider to be made the default must be in the collection.');
    }

    this.currentDefaultProvider = md;
    this.render();
  }

  clickMakeDefaultProvider() {
    this.makeDefaultProvider(this._search.provider);
    recordEvent('Discover_MakeDefaultProvider', {
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
    });
  }

  addProvider() {
    if (!this.doesProviderURLExist(this._search.provider)) {
      app.searchProviders.add(this._search.provider);
      this.render();
    }//TODO should there be an error shown for existing providers? Or just activate them?
  }

  clickAddProvider() {
    this.addProvider();
  }

  /**
   * This will add the categories one by one, with the next one triggered by the last one being
   * fetched. this._categorySearchesToAdd should be filled with search objects when calling this.
   */
  addNextCategory() {
    if (!Array.isArray(this._categorySearchesToAdd)) {
      throw new Error('this._categorySearchesToAdd should be a valid array of search objects.');
    }

    if (!this._categorySearchesToAdd[0]) return;

    const search = this._categorySearchesToAdd.shift();
    const category = this.createChild(Category, {
      search,
      viewType: search.filters.type === 'cryptocurrency' ? 'cryptoList' : 'grid',
    });
    this.categories.push(category);

    this.getCachedEl('.js-categoryWrapper').append(category.render().el);

    this.listenTo(category, 'seeAllCategory', (opts) => {
      scrollPageIntoView();
      this.setSearch(opts);
    });
    this.listenTo(category, 'fetchComplete', () => this.addNextCategory());
  }

  createResults(data, search) {
    this.resultsCol = new ResultsCol();
    this.resultsCol.add(this.resultsCol.parse(data));

    let viewType = 'grid';

    if (data && data.options && data.options.type &&
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
    });

    recordEvent('Discover_Results', {
      total: data.results ? data.results.total : 0,
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
      page: this._search.page + 1,
    });

    this.getCachedEl('.js-resultsWrapper').html(this.resultsView.render().el);

    this.listenTo(this.resultsView, 'searchError', (xhr) => {
      this.setState({
        fetching: false,
        data: '',
        xhr,
      });
    });
    this.listenTo(this.resultsView, 'loadingPage', () => scrollPageIntoView());
    this.listenTo(this.resultsView, 'resetSearch', () => this.resetSearch());
  }

  clickSearchBtn() {
    this.setSearch({ q: this.getCachedEl('.js-searchInput').val(), p: 0 });
    recordEvent('Discover_ClickSearch');
    recordEvent('Discover_Search', { type: 'click' });
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.setSearch({ q: this.getCachedEl('.js-searchInput').val(), p: 0 });
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
    this.setSearch({ q: opts.suggestion });
    recordEvent('Discover_ClickSuggestion');
    recordEvent('Discover_Search', { type: 'suggestion' });
  }

  removeFetches() {
    this.searchFetches.forEach(fetch => fetch.abort());
  }

  remove() {
    this.removeFetches();
    super.remove();
  }

  render() {
    super.render();
    const state = this.getState();
    const data = state.data || {};
    const term = this._search.q === '*' ? '' : this._search.q;

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
        providerLocked: this.providerIsADefault(this._search.provider.id),
        isExistingProvider: this.doesProviderURLExist(this._search.provider),
        showMakeDefault: this._search.provider !== this.currentDefaultProvider,
        emptyData: $.isEmptyObject(data) && !state.showHome,
        showFilters: data.options,
        ...state,
        ...this._search.provider,
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
      urlType: this.urlType,
      currentID: this._search.provider.id,
      selecting: !this.currentDefaultProvider,
    });
    this.listenTo(this.searchProviders, 'activateProvider', pOpts => this.activateProvider(pOpts));
    this.$('.js-searchProviders').append(this.searchProviders.render().el);

    if (this.suggestions) this.suggestions.remove();
    this.suggestions = this.createChild(Suggestions);
    this.listenTo(this.suggestions, 'clickSuggestion', opts => this.onClickSuggestion(opts));
    this.$('.js-suggestions').append(this.suggestions.render().el);

    this.categories.forEach(cat => cat.remove());

    if (state.showHome) {
      // Create a disposable copy to be shifted by the addNextCategory function.
      this._categorySearchesToAdd = [...this._categorySearches];
      this.addNextCategory();
    } else {
      if (this.filters) this.filters.remove();
      if (data.options) {
        this.filters = this.createChild(Filters, { initialState: { filters: data.options } });
        this.listenTo(this.filters, 'filterChanged', opts => this.onFilterChanged(opts));
        $filterWrapper.append(this.filters.render().el);

        $filterWrapper.find('select').select2({
          minimumResultsForSearch: 10,
          templateResult: selectEmojis,
          templateSelection: selectEmojis,
        });
      }

      if (this.sortBy) this.sortBy.remove();
      if (data.sortBy) {
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
      }

      // use the initial set of results data to create the results view
      this.createResults(data, this._search);
    }

    this.$filters = $filterWrapper.find('select, input');

    return this;
  }
}
