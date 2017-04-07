import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import $ from 'jquery';
import Dialog from '../modals/Dialog';
import Results from './Results';
import ResultsCol from '../../collections/Results';
import { launchSettingsModal } from '../../utils/modalManager';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    const queryParams = (new URL(`http://blah-blah?${options.query || ''}`)).searchParams;
    const providerQuery = queryParams.get('providerQ');

    if (providerQuery) {
      // A query for a specific provider was provided.
      const searchURL = new URL(providerQuery);
      const params = searchURL.searchParams;
      this.sProvider = `${searchURL.origin}${searchURL.pathname}`;
      this.serverPage = params.get('p') || 0;
      this.pageSize = params.get('ps') || 12;
      this.term = params.get('q') || '';
      this.callSearchProvider(searchURL);
    } else {
      this.sProvider = app.localSettings.get('searchProvider');
      this.serverPage = options.serverPage || 0;
      this.pageSize = options.pageSize || 12;
      // if the term was not a url, process the term before calling the search provider
      this.processTerm(queryParams.get('q') || '');
    }

    this.usingDefault = this.sProvider === app.localSettings.get('searchProvider');

    // if not using a passed in URL, update the default provider if it changes
    this.listenTo(app.localSettings, 'change:searchProvider', (_, provider) => {
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

  get sortByQuery() {
    // return current sortBy state in the form of a query string
    return this.sortBy ? `&sortBy=${this.sortBy.val()}` : '';
  }

  get filterQuery() {
    // return all currently active filters in the form of a query string
    return this.$filters ? `&${this.$filters.serialize()}` : '';
  }

  processTerm(term) {
    this.term = term || '';
    // if term has spaces, replace them with +
    // if term is false, search for *
    const query = `q=${term ? term.replace(/\s+/g, '+') : '*'}`;
    const page = `&p=${this.serverPage}&ps=${this.pageSize}`;
    const searchURL = `${this.sProvider}?${query}${this.sortByQuery}${this.filterQuery}${page}`;

    this.callSearchProvider(searchURL);
  }

  callSearchProvider(searchURL) {
    // remove a pending search if it exists
    if (this.callSearch) this.callSearch.abort();

    // initial render to show the loading spinner
    this.render();

    // query the search provider
    this.callSearch = $.get({
      url: searchURL,
    })
        .done((data) => {
          this.render(data, searchURL);
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
      total: data.results.total,
      morePages: data.results.morePages,
      serverPage: this.serverPage,
      pageSize: this.pageSize,
      initCol: this.resultsCol,
    });

    this.$resultsWrapper.html(resultsView.render().el);

    this.listenTo(resultsView, 'searchError', (xhr) => this.showSearchError(xhr));
    this.listenTo(resultsView, 'pageLoaded', () => this.scrollToTop());
  }

  clickSearchBtn() {
    this.processTerm(this.$searchInput.val());
  }

  onKeyupSearchInput(e) {
    if (e.which === 13) {
      this.processTerm(this.$searchInput.val());
    }
  }

  changeSortBy() {
    this.processTerm(this.term);
  }

  changeFilter() {
    this.processTerm(this.term);
  }

  changeProvider() {
    launchSettingsModal();
  }

  useDefault() {
    this.usingDefault = true;
    this.sProvider = app.localSettings.get('searchProvider');
    this.processTerm(this.term);
  }

  scrollToTop() {
    this.$el[0].scrollIntoView();
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
        term: this.term,
        provider: this.sProvider,
        defaultProvider: app.localSettings.get('searchProvider'),
        emptyData,
        loading,
        ...data,
      }));
    });
    this.$sortBy = this.$('#sortBy');
    this.$sortBy.select2();
    this.$('.js-filterWrapper').find('select').select2();
    this.$filters = this.$('.js-filterWrapper').find('select, input');
    this.$resultsWrapper = this.$('.js-resultsWrapper');
    this.$searchInput = this.$('.js-searchInput');
    this.$searchLogo = this.$('.js-searchLogo');

    this.$searchLogo.find('img').on('error', () => {
      this.$searchLogo.addClass('loadError');
    });

    // use the initial set of results data to create the results view
    if (data && data.results) this.createResults(data, searchURL);

    return this;
  }
}
