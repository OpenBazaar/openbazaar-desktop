import _ from 'underscore';
import $ from 'jquery';
import is from 'is_js';
import '../../lib/select2';
import app from '../../app';
import baseVw from '../baseVw';
import Results from './Results';
import Providers from './SearchProviders';
import Suggestions from './Suggestions';
import Filters from './Filters';
import Dialog from '../modals/Dialog';
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
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this._search = {
      urlType: opts.urlType || 'listingsUrl',
    };

    this.usingTor = app.serverConfig.tor && getCurrentConnection().server.get('useTor');

    // In the future there may be more possible types
    this.urlType = this.usingTor ? 'torlistings' : 'listings';

    // If there is only one provider and it isn't the default, just set it to be such.
    if (!this.currentDefaultProvider && app.searchProviders.length === 1) {
      this.currentDefaultProvider = app.searchProviders.at(0);
    }
    this._search.provider = this.currentDefaultProvider;

    // if the  provider returns a bad URL, change to a known good default provider
    if (is.not.url(this.currentBaseUrl)) {
      this._search.provider = app.searchProviders.at(0);
      recordEvent('Discover_InvalidDefaultProvider',
        { url: this.currentBaseUrl });
    }

    if (options.query) {
      recordEvent('Discover_SearchFromAddressBar');
      recordEvent('Discover_Search', { type: 'addressBar' });
    }

    const tempUrl = new URL(`${this.currentBaseUrl}?${options.query || ''}`);
    let queryParams = tempUrl.searchParams;

    // if a url with parameters was in the query, use the parameters in it instead.
    if (queryParams.get('providerQ')) {
      const subURL = new URL(queryParams.get('providerQ'));
      queryParams = subURL.searchParams;
      const base = `${subURL.origin}${subURL.pathname}`;
      /* if the query provider doesn't exist, create a provider model for it.
         One quirk to note: if a tor url is passed in while the user is in clear mode, and an
         existing provider has that tor url, that provider will be activated but will use its
         clear url if it has one. The opposite is also true.
       */
      const matchedProvider = app.searchProviders.getProviderByURL(base);
      if (!matchedProvider) {
        const queryOpts = {};
        queryOpts[`${this.usingTor ? 'tor' : ''}${capitalize(this.search.urlType)}`] = base;
        // TODO: add model validation here? What would the user see if there is an error?
        this._search.provider = new ProviderMd(queryOpts);
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

    // use the parameters from the query unless they were overridden in the options
    this.serverPage = options.serverPage || params.p || 0;
    this.pageSize = options.pageSize || params.ps || 66;
    this.term = options.term || params.q || '';
    this.sortBySelected = options.sortBySelected || params.sortBy || '';

    // all parameters not specified above are assumed to be filters
    const filterParams = _.omit(params, ['q', 'p', 'ps', 'sortBy', 'providerQ', 'network']);

    // set an initial set of filters for the first query
    // if not passed in, set the user's values for nsfw and the currency
    this.defaultParams = {
      nsfw: String(app.settings.get('showNsfw')),
      acceptedCurrencies: supportedWalletCurs(),
    };

    this.filterParams = {
      ...this.defaultParams,
      ...filterParams,
    };

    this.searchFetches = [];

    this.processTerm(this.term);
  }

  className() {
    return 'search';
  }

  events() {
    return {
      'click .js-searchBtn': 'clickSearchBtn',
      'change .js-sortBy': 'changeSortBy',
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

  /**
   * This will retrieve search results.
   * @param {string} term - the term to search for
   * @param {boolean} reset - reset the filters
   */
  processTerm(term, reset) {
    this.term = term || '';
    const baseUrl = this.currentBaseUrl;
    const formData = this.filters ? this.filters.retrieveFormData() : {};
    // keep any parameters that aren't present in the form on the page
    let filters = { ...this.defaultParams };
    if (!reset) filters = { ...filters, ...this.filterParams, ...formData };

    const opts = {
      baseUrl,
      term,
      page: this.serverPage,
      pageSize: this.pageSize,
      sortBy: this.sortBySelected,
      filters,
    };
    const searchUrl = createSearchURL(opts);

    this.removeFetches();

    this.setState({
      fetching: true,
      searchUrl,
      xhr: '',
    });

    const searchFetch = fetchSearchResults(searchUrl)
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
    this._search.provider = md;
    this.serverPage = 0;
    if (!this.currentDefaultProvider) this.makeDefaultProvider(md);
    this.processTerm(this.term, true);
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
    this.serverPage = 0;
    this.filterParams = '';
    this.processTerm('', true);
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
    }
  }

  clickAddProvider() {
    this.addProvider();
  }

  showSearchError(xhr = {}) {
    const provider = this._search.provider.get('name') || this.currentBaseUrl;
    const title = app.polyglot.t('search.errors.searchFailTitle', { provider });
    const failReason = xhr.responseJSON ? xhr.responseJSON.reason : '';
    const msg = failReason ?
                app.polyglot.t('search.errors.searchFailReason', { error: failReason }) : '';
    const buttons = [];
    if (this.usingOriginal) {
      buttons.push({
        text: app.polyglot.t('search.changeProvider'),
        fragment: 'changeProvider',
      });
    } else {
      buttons.push({
        text: app.polyglot.t('search.useDefault',
          {
            term: this.term,
            defaultProvider: this.currentDefaultProvider,
          }),
        fragment: 'useDefault',
      });
    }

    const errorDialog = new Dialog({
      title,
      msg,
      buttons,
      showCloseButton: false,
      removeOnClose: true,
    }).render().open();
    this.listenTo(errorDialog, 'click-changeProvider', () => {
      errorDialog.close();
    });
    this.listenTo(errorDialog, 'click-useDefault', () => {
      this.activateProvider(app.searchProviders.at(0));
      errorDialog.close();
    });

    recordEvent('Discover_SearchError', {
      error: msg || 'unknown error',
      provider: this._search.provider.get('name') || 'unknown',
      url: this._search.provider.listings,
    });
  }

  createResults(data, searchUrl) {
    this.resultsCol = new ResultsCol();
    this.resultsCol.add(this.resultsCol.parse(data));

    let viewType = 'grid';

    if (data && data.options && data.options.type &&
      data.options.type.options &&
      data.options.type.options.length) {
      if (data.options.type.options.find(
        op => op.value === 'cryptocurrency' && op.checked
      )) {
        viewType = 'cryptoList';
      }
    }

    const resultsView = this.createChild(Results, {
      searchUrl,
      reportsUrl: this._search.provider.reports || '',
      total: data.results ? data.results.total : 0,
      morePages: data.results ? data.results.morePages : false,
      serverPage: this.serverPage,
      pageSize: this.pageSize,
      initCol: this.resultsCol,
      viewType,
    });

    recordEvent('Discover_Results', {
      total: data.results ? data.results.total : 0,
      provider: this._search.provider.get('name') || 'unknown',
      url: this.currentBaseUrl,
      page: this.serverPage + 1,
    });

    this.$resultsWrapper.html(resultsView.render().el);

    this.listenTo(resultsView, 'searchError', (xhr) => this.showSearchError(xhr));
    this.listenTo(resultsView, 'loadingPage', () => this.scrollToTop());
    this.listenTo(resultsView, 'resetSearch', () => this.resetSearch());
  }

  clickSearchBtn() {
    this.serverPage = 0;
    this.processTerm(this.$searchInput.val());
    recordEvent('Discover_ClickSearch');
    recordEvent('Discover_Search', { type: 'click' });
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.serverPage = 0;
      this.processTerm(this.$searchInput.val());
      recordEvent('Discover_EnterKeySearch');
      recordEvent('Discover_Search', { type: 'enterKey' });
    }
  }

  changeSortBy(e) {
    this.sortBySelected = $(e.target).val();
    this.serverPage = 0;
    this.processTerm(this.term);
    recordEvent('Discover_ChangeSortBy');
  }

  onFilterChanged() {
    this.serverPage = 0;
    this.processTerm(this.term);
    recordEvent('Discover_ChangeFilter');
  }

  onClickSuggestion(opts) {
    this.processTerm(opts.suggestion);
    recordEvent('Discover_ClickSuggestion');
    recordEvent('Discover_Search', { type: 'suggestion' });
  }

  scrollToTop() {
    this.$el[0].scrollIntoView();
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
    const data = state.data;

    if (data && !state.searchUrl) {
      throw new Error('Please provide the search URL along with the data.');
    }

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
        term: this.term === '*' ? '' : this.term,
        sortBySelected: this.sortBySelected,
        errTitle,
        errMsg,
        providerLocked: this.providerIsADefault(this._search.provider.id),
        isExistingProvider: this.doesProviderURLExist(this._search.provider),
        showMakeDefault: this._search.provider !== this.currentDefaultProvider,
        emptyData: $.isEmptyObject(data),
        ...state,
        ...this._search.provider,
        ...data,
      }));
    });
    this.$sortBy = this.$('#sortBy');
    this.$sortBy.select2({
      // disables the search box
      minimumResultsForSearch: Infinity,
      templateResult: selectEmojis,
      templateSelection: selectEmojis,
    });
    const filterWrapper = this.$('.js-filterWrapper');
    filterWrapper.find('select').select2({
      minimumResultsForSearch: 10,
      templateResult: selectEmojis,
      templateSelection: selectEmojis,
    });
    this.$filters = filterWrapper.find('select, input');
    this.$resultsWrapper = this.$('.js-resultsWrapper');
    this.$searchInput = this.$('.js-searchInput');
    this.$searchLogo = this.$('.js-searchLogo');

    this.$searchLogo.find('img').on('error', () => {
      this.$searchLogo.addClass('loadError');
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

    if (this.filters) this.filters.remove();
    if (data && data.options) {
      this.filters = this.createChild(Filters, {initialState: {filters: data.options}});
      this.listenTo(this.filters, 'filterChanged', opts => this.onFilterChanged(opts));
      this.$('.js-filterWrapper').append(this.filters.render().el);
    }

    // use the initial set of results data to create the results view
    if (data) this.createResults(data, state.searchUrl);

    return this;
  }
}
