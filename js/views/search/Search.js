import _ from 'underscore';
import $ from 'jquery';
import is from 'is_js';
import sanitizeHtml from 'sanitize-html';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Dialog from '../modals/Dialog';
import Results from './Results';
import ResultsCol from '../../collections/Results';
import Providers from './SearchProviders';
import ProviderMd from '../../models/search/SearchProvider';
import Suggestions from './Suggestions';
import defaultSearchProviders from '../../data/defaultSearchProviders';
import '../../lib/select2';
import { selectEmojis } from '../../utils';
import { getCurrentConnection } from '../../utils/serverConnect';
import { getServerCurrency } from '../../data/cryptoCurrencies';

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

    this.defaultSuggestions = this.options.defaultSuggestions ||
      [
        'books',
        'clothing',
        'electronics',
        'food',
        'games',
        'health',
        'movies',
        'music',
        'sports',
        'toys',
      ];

    // in the future there may be more possible types
    this.urlType = this.usingTor ? 'torlistings' : 'listings';

    this.sProvider = app.searchProviders[`default${this.torString}Provider`];
    this.queryProvider = false;

    // if the  provider returns a bad URL, the user must select a provider
    if (is.not.url(this.providerUrl)) {
      // use the first default temporarily to construct the tempUrl below
      this.sProvider = app.searchProviders.get(defaultSearchProviders[0].id);
      this.mustSelectDefault = true;
    }

    const tempUrl = new URL(`${this.providerUrl}?${options.query || ''}`);
    let queryParams = tempUrl.searchParams;

    // if a url with parameters was in the query in, use the parameters in it instead.
    if (queryParams.get('providerQ')) {
      const subURL = new URL(queryParams.get('providerQ'));
      queryParams = subURL.searchParams;
      const base = `${subURL.origin}${subURL.pathname}`;
      const matchedProvider =
        app.searchProviders.filter(p =>
          base === p.get('listings') || base === p.get('torlistings'));
      /* if the query provider doesn't exist, create a temporary provider model for it.
         One quirk to note: if a tor url is passed in while the user is in clear mode, and an
         existing provider has that tor url, that provider will be activated but will use its
         clear url if it has one. The opposite is also true.
       */
      if (!matchedProvider.length) {
        const queryOpts = {};
        queryOpts[`${this.usingTor ? 'tor' : ''}listings`] = `${subURL.origin}${subURL.pathname}`;
        this.queryProvider = true;
        this.sProvider = new ProviderMd(queryOpts);
      } else {
        this.sProvider = matchedProvider[0];
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
    this.pageSize = options.pageSize || params.ps || 24;
    this.term = options.term || params.q || '';
    this.sortBySelected = options.sortBySelected || params.sortBy || '';

    // all parameters not specified above are assumed to be filters
    const filterParams = _.omit(params, ['q', 'p', 'ps', 'sortBy', 'providerQ', 'network']);

    // set an initial set of filters for the first query
    // if not passed in, set the user's values for nsfw and the currency
    this.defaultParams = {
      nsfw: String(app.settings.get('showNsfw')),
      acceptedCurrencies: getServerCurrency().code,
    };

    this.filterParams = {
      ...this.defaultParams,
      ...filterParams,
    };

    this.processTerm(this.term);
  }

  className() {
    return 'search';
  }

  events() {
    return {
      'click .js-searchBtn': 'clickSearchBtn',
      'change .js-sortBy': 'changeSortBy',
      'change .js-filterWrapper select': 'changeFilter',
      'change .js-filterWrapper input': 'changeFilter',
      'keyup .js-searchInput': 'onKeyupSearchInput',
      'click .js-deleteProvider': 'clickDeleteProvider',
      'click .js-makeDefaultProvider': 'clickMakeDefaultProvider',
      'click .js-addQueryProvider': 'clickAddQueryProvider',
    };
  }

  get usingOriginal() {
    return this.sProvider.id === defaultSearchProviders[0].id;
  }

  get usingTor() {
    return app.serverConfig.tor && getCurrentConnection().server.get('useTor');
  }

  get torString() {
    return this.usingTor ? 'Tor' : '';
  }

  get providerUrl() {
    // if a provider was created by the address bar query, use it instead.
    // return false if no provider is available
    return 'https://staging.search.ob1.io/search/listings';
    const currentProvider = this.sProvider;
    return currentProvider && currentProvider.get(this.urlType);
  }

  getCurrentProviderID() {
    // if the user must select a default, or the provider is from the query, return no id
    return this.queryProvider || this.mustSelectDefault ? '' : this.sProvider.id;
  }

  /**
   * This will create a url with the term and other query parameters
   * @param {string} term
   */
  processTerm(term) {
    this.term = term || '';
    // if term is false, search for *
    const query = `q=${encodeURIComponent(term || '*')}`;
    const page = `&p=${this.serverPage}&ps=${this.pageSize}`;
    const sortBy = this.sortBySelected ? `&sortBy=${encodeURIComponent(this.sortBySelected)}` : '';
    const network = `&network=${!!app.serverConfig.testnet ? 'testnet' : 'mainnet'}`;
    const formData = this.getFormData(this.$filters);
    // keep any parameters that aren't present in the form on the page
    let filters = $.param({ ...this.defaultParams, ...this.filterParams, ...formData });
    filters = filters ? `&${filters}` : '';
    const newURL = new URL(`${this.providerUrl}?${query}${network}${sortBy}${page}${filters}`);
    this.callSearchProvider(newURL);
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
    this.sProvider = md;
    this.queryProvider = false;
    this.serverPage = 0;
    if (this.mustSelectDefault) {
      this.mustSelectDefault = false;
      this.makeDefaultProvider();
    }
    this.filterParams = '';
    this.processTerm(this.term);
  }

  deleteProvider(md = this.sProvider) {
    if (md.get('locked')) {
      openSimpleMessage(app.polyglot.t('search.errors.locked'));
    } else {
      md.destroy();
      if (app.searchProviders.length) this.activateProvider(app.searchProviders.at(0));
    }
  }

  clickDeleteProvider() {
    this.deleteProvider();
  }

  makeDefaultProvider() {
    if (app.searchProviders.indexOf(this.sProvider) === -1) {
      throw new Error('The provider to be made the default must be in the collection.');
    }

    app.searchProviders[`default${this.torString}Provider`] = this.sProvider;
    this.getCachedEl('.js-makeDefaultProvider').addClass('hide');
  }

  clickMakeDefaultProvider() {
    this.makeDefaultProvider();
  }

  addQueryProvider() {
    if (this.queryProvider) app.searchProviders.add(this.sProvider);
    this.activateProvider(this.sProvider);
  }

  clickAddQueryProvider() {
    this.addQueryProvider();
  }

  callSearchProvider(searchUrl) {
    // remove a pending search if it exists
    if (this.callSearch) this.callSearch.abort();

    this.setState({
      fetching: true,
      selecting: this.mustSelectDefault,
      data: '',
      searchUrl,
      xhr: '',
    });

    if (!this.mustSelectDefault) {
      // query the search provider
      this.callSearch = $.get({
        url: searchUrl,
        dataType: 'json',
      })
        .done((pData, status, xhr) => {
          let data = JSON.stringify(pData, (key, val) => {
            // sanitize the data from any dangerous characters
            if (typeof val === 'string') {
              return sanitizeHtml(val, {
                allowedTags: [],
                allowedAttributes: [],
              });
            }
            return val;
          });
          data = JSON.parse(data);
          // make sure minimal data is present
          if (data.name && data.links) {
            // if data about the provider is recieved, update the model
            const update = { name: data.name };
            const urlTypes = [];
            if (data.logo && is.url(data.logo)) update.logo = data.logo;
            if (data.links) {
              if (is.url(data.links.search)) {
                update.search = data.links.search;
                urlTypes.push('search');
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
                if (is.url(data.links.tor.search)) {
                  update.torsearch = data.links.tor.search;
                  urlTypes.push('torsearch');
                }
                if (is.url(data.links.tor.listings)) {
                  update.torlistings = data.links.tor.listings;
                  urlTypes.push('torlistings');
                }
              }
            }
            // update the defaults but do not save them
            if (!_.findWhere(defaultSearchProviders, { id: this.sProvider.id })) {
              this.sProvider.save(update, { urlTypes });
            } else {
              this.sProvider.set(update, { urlTypes });
            }
            this.setState({
              fetching: false,
              selecting: false,
              data,
              searchUrl,
              xhr: '',
            });
          } else {
            this.setState({
              fetching: false,
              selecting: false,
              data: '',
              searchUrl,
              xhr,
            });
          }
        })
        .fail((xhr) => {
          if (xhr.statusText !== 'abort') {
            this.setState({
              fetching: false,
              selecting: false,
              data: '',
              searchUrl,
              xhr,
            });
          }
        });
    }
  }

  showSearchError(xhr = {}) {
    const title = app.polyglot.t('search.errors.searchFailTitle', { provider: this.sProvider });
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
            defaultProvider: app.searchProviders[`default${this.torString}Provider`],
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
      reportsUrl: this.sProvider.get('reports') || '',
      total: data.results ? data.results.total : 0,
      morePages: data.results ? data.results.morePages : false,
      serverPage: this.serverPage,
      pageSize: this.pageSize,
      initCol: this.resultsCol,
      viewType,
    });

    this.$resultsWrapper.html(resultsView.render().el);

    this.listenTo(resultsView, 'searchError', (xhr) => this.showSearchError(xhr));
    this.listenTo(resultsView, 'loadingPage', () => this.scrollToTop());
  }

  clickSearchBtn() {
    this.serverPage = 0;
    this.processTerm(this.$searchInput.val());
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.serverPage = 0;
      this.processTerm(this.$searchInput.val());
    }
  }

  changeSortBy(e) {
    this.sortBySelected = $(e.target).val();
    this.serverPage = 0;
    this.processTerm(this.term);
  }

  changeFilter() {
    this.serverPage = 0;
    this.processTerm(this.term);
  }

  onClickSuggestion(opts) {
    this.processTerm(opts.suggestion);
  }

  scrollToTop() {
    this.$el[0].scrollIntoView();
  }

  remove() {
    if (this.callSearch) this.callSearch.abort();
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

    // check to see if the call to the provider failed, or returned an empty result
    const emptyData = $.isEmptyObject(data);

    if (state.xhr) {
      errTitle = app.polyglot.t('search.errors.searchFailTitle', { provider: state.searchUrl });
      const failReason = state.xhr.responseJSON ? state.xhr.responseJSON.reason : '';
      errMsg = failReason ?
        app.polyglot.t('search.errors.searchFailReason', { error: failReason }) : '';
    }

    const isDefaultProvider =
      this.sProvider === app.searchProviders[`default${this.torString}Provider`];

    loadTemplate('search/search.html', (t) => {
      this.$el.html(t({
        term: this.term === '*' ? '' : this.term,
        sortBySelected: this.sortBySelected,
        filterParams: this.filterParams,
        errTitle,
        errMsg,
        providerLocked: this.sProvider.get('locked'),
        isQueryProvider: this.queryProvider,
        isDefaultProvider,
        emptyData,
        ...state,
        ...this.sProvider,
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
      currentID: this.getCurrentProviderID(),
      selecting: this.mustSelectDefault,
    });
    this.listenTo(this.searchProviders, 'activateProvider', pOpts => this.activateProvider(pOpts));
    this.$('.js-searchProviders').append(this.searchProviders.render().el);

    if (this.suggestions) this.suggestions.remove();
    this.suggestions = this.createChild(Suggestions, {
      initialState: {
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : this.defaultSuggestions,
      },
    });
    this.listenTo(this.suggestions, 'clickSuggestion', opts => this.onClickSuggestion(opts));
    this.$('.js-suggestions').append(this.suggestions.render().el);

    // use the initial set of results data to create the results view
    if (data) this.createResults(data, state.searchUrl);

    return this;
  }
}
