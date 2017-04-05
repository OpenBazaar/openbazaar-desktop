import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import $ from 'jquery';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Results from './Results';
import ResultsCol from '../../collections/Results';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    const term = options.term;
    const testForURL = /^((http|https|ob):\/\/)/;

    if (term && testForURL.test(term)) {
      // if a search URL was passed in, reconstruct the url and parse the data
      const searchURL = new URL(`${term}${options.query ? `?${options.query}` : ''}`);
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
      this.term = term;
      this.processTerm(term);
    }
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
    this.term = term;
    // if term has spaces, replace them with +
    const query = term ? `q=${term.replace(/\s+/g, '+')}` : 'q=*';
    const page = `&p=${this.serverPage}&ps=${this.pageSize}`;
    const provider = `${this.sProvider}?`;
    const searchURL = `${provider}${query}${this.sortByQuery}${this.filterQuery}${page}`;

    this.callSearchProvider(searchURL);
  }

  callSearchProvider(searchURL) {
    // query the search provider
    $.get({
      url: searchURL,
    })
        .done((data) => {
          this.render(data, searchURL);
        })
        .fail((xhr) => {
          const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
          openSimpleMessage(
              app.polyglot.t('search.errors.searchFailTitle', { provider: searchURL }),
              app.polyglot.t('search.errors.searchFailReason', { error: failReason })
          );
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

  render(data, searchURL) {
    if (!data) {
      throw new Error('Please provide data for the render.');
    }
    if (!searchURL) {
      throw new Error('Please provide the search URL used for the render data.');
    }

    loadTemplate('search/Search.html', (t) => {
      this.$el.html(t({
        term: this.term,
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
    this.createResults(data, searchURL);

    return this;
  }
}
