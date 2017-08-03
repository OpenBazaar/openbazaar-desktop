import _ from 'underscore';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import $ from 'jquery';
import Dialog from '../modals/Dialog';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Results from './Results';
import ResultsCol from '../../collections/Results';
import Providers from './Providers';
import { launchSettingsModal } from '../../utils/modalManager';
import { selectEmojis } from '../../utils';
import { getCurrentConnection } from '../../utils/serverConnect';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.searchProviders = this.createChild(Providers);
    this.listenTo(this.searchProviders, 'activateProvider', opts => this.activateProvider(opts));

    this.sProvider = app.searchProviders.defaultProvider.get('searchUrl');

    // the search provider is used here as a placeholder to get the parameters from the created url
    const searchURL = new URL(`${this.sProvider}?${options.query || ''}`);
    let queryParams = searchURL.searchParams;

    // if a url with parameters was in the query in, use the parameters in it instead.
    if (queryParams.get('providerQ')) {
      const subURL = new URL(queryParams.get('providerQ'));
      queryParams = subURL.searchParams;
      this.sProvider = `${subURL.origin}${subURL.pathname}`;
    }

    const params = {};

    for (const param of queryParams.entries()) {
      params[param[0]] = param[1];
    }

    // use the parameters from the query unless they were overridden in the options
    this.serverPage = options.serverPage || params.p || 0;
    this.pageSize = options.pageSize || params.ps || 12;
    this.term = options.term || params.q || '';
    this.sortBySelected = options.sortBySelected || params.sortBy || '';
    // all parameters not specified above are assumed to be filters
    this.filters = _.omit(params, ['q', 'p', 'ps', 'sortBy', 'providerQ']);

    this.processTerm(this.term);

    // if not using a passed in URL, update the default provider if it changes
    this.listenTo(app.localSettings, 'change:searchProvider', (model, provider) => {
      if (this.usingDefault) {
        this.sProvider = provider;
        this.processTerm(this.term);
      }
    });
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
    };
  }

  get usingDefault() {
    return this.sProvider === app.localSettings.get('searchProvider');
  }

  activateProvider(opts) {
    if (!opts.searchUrl && !opts.torSearchUrl) {
      throw new Error('Please provide a search URL.');
    }
    const curConn = getCurrentConnection();
    if (curConn && curConn.status !== 'disconnected') {
      this.sProvider = app.serverConfig.tor && getCurrentConnection().server.get('useTor') ?
        opts.torSearchUrl : opts.searchUrl;
      this.processTerm(this.term);
    } else {
      openSimpleMessage(app.polyglot.t('search.errors.connection'));
    }
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
    let filters = $.param(this.filters);
    filters = filters ? `&${filters}` : '';
    const newURL = `${this.sProvider}?${query}${sortBy}${page}${filters}`;

    this.callSearchProvider(newURL);
  }

  callSearchProvider(searchURL) {
    // remove a pending search if it exists
    if (this.callSearch) this.callSearch.abort();

    // initial render to show the loading spinner
    this.render();

    // query the search provider
    this.callSearch = $.get({
      url: searchURL,
      dataType: 'json',
    })
        .done((data, status, xhr) => {
        // make sure minimal data is present
          if (data.name && data.links) {
            this.render(data, searchURL);
          } else {
            this.showSearchError(xhr);
            this.render({}, searchURL);
          }
        })
        .fail((xhr) => {
          if (xhr.statusText !== 'abort') {
            this.showSearchError(xhr);
            this.render({}, searchURL);
          }
        });
  }

  showSearchError(xhr = {}) {
    const title = app.polyglot.t('search.errors.searchFailTitle', { provider: this.sProvider });
    const failReason = xhr.responseJSON ? xhr.responseJSON.reason : '';
    const msg = failReason ?
                app.polyglot.t('search.errors.searchFailReason', { error: failReason }) : '';
    const buttons = [];
    if (this.usingDefault) {
      buttons.push({
        text: app.polyglot.t('search.changeProvider'),
        fragment: 'changeProvider',
      });
    } else {
      buttons.push({
        text: app.polyglot.t('search.useDefault',
          { term: this.term, defaultProvider: app.localSettings.get('searchProvider') }),
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
      this.changeProvider();
      errorDialog.close();
    });
    this.listenTo(errorDialog, 'click-useDefault', () => {
      this.useDefault();
      errorDialog.close();
    });
  }

  createResults(data, searchURL) {
    this.resultsCol = new ResultsCol();
    this.resultsCol.add(this.resultsCol.parse(data));

    const resultsView = this.createChild(Results, {
      searchURL,
      total: data.results ? data.results.total : 0,
      morePages: data.results ? data.results.morePages : false,
      serverPage: this.serverPage,
      pageSize: this.pageSize,
      initCol: this.resultsCol,
    });

    this.$resultsWrapper.html(resultsView.render().el);

    this.listenTo(resultsView, 'searchError', (xhr) => this.showSearchError(xhr));
    this.listenTo(resultsView, 'loadingPage', () => this.scrollToTop());
  }

  clickSearchBtn() {
    this.processTerm(this.$searchInput.val());
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.processTerm(this.$searchInput.val());
    }
  }

  changeSortBy(e) {
    this.sortBySelected = $(e.target).val();
    this.processTerm(this.term);
  }

  changeFilter(e) {
    const targ = $(e.target);
    this.filters[targ.prop('name')] = targ.val();
    this.processTerm(this.term);
  }

  changeProvider() {
    launchSettingsModal();
  }

  useDefault() {
    this.sProvider = app.localSettings.get('searchProvider');
    this.processTerm(this.term);
  }

  scrollToTop() {
    this.$el[0].scrollIntoView();
  }

  remove() {
    if (this.callSearch) this.callSearch.abort();
    super.remove();
  }

  render(data, searchURL) {
    if (data && !searchURL) {
      throw new Error('Please provide the search URL along with the data.');
    }

    // the first render has no data, and only shows the loading state
    const loading = !data;

    // check to see if the call to the provider failed, or returned an empty result
    const emptyData = $.isEmptyObject(data);

    loadTemplate('search/Search.html', (t) => {
      this.$el.html(t({
        term: this.term === '*' ? '' : this.term,
        provider: this.sProvider,
        defaultProvider: app.localSettings.get('searchProvider'),
        sortBySelected: this.sortBySelected,
        filterVals: this.filters,
        emptyData,
        loading,
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
      // disables the search box
      minimumResultsForSearch: Infinity,
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

    // this.searchProviders.delegateEvents();
    this.$('.js-searchProviders').append(this.searchProviders.render().el);

    // use the initial set of results data to create the results view
    if (data) this.createResults(data, searchURL);

    return this;
  }
}
