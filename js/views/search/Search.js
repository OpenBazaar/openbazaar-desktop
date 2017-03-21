import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import $ from 'jquery';
import { openSimpleMessage } from '../modals/SimpleMessage';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.sProvider = app.localSettings.get('searchProvider');
    this.sortBy = '';
    this.currentPage = 0;
    this.pageSize = 12;
    // process the data passed in from the router, if any
    this.processTerm(options.term);
  }

  className() {
    return 'search';
  }

  events() {
    return {
      'click .js-searchBtn': 'clickSearchBtn',
      'change .js-sortBy': 'changeSortBy',
    };
  }

  get sortByQuery() {
    // return current sortBy state in the form of a query string
    return '';
  }

  get filterQuery() {
    // return all currently active filters in the form of a query string
    return '';
  }

  processTerm(term) {
    console.log(term);
    const testForURL = /^((http|https|ob):\/\/)/;
    let searchURL = '';

    if (testForURL.test(term)) {
      // assume term is a search provider query
      searchURL = term;
    } else {
      const query = term ? `q=${term.replace(/\s+/g, '+')}` : 'q=*';
      const page = `&p=${this.currentPage}&ps=${this.pageSize}`;
      searchURL = `${this.sProvider}?${query}${this.sortByQuery}${this.filterQuery}${page}`;
    }

    this.callSearchProvider(searchURL);
  }

  callSearchProvider(searchURL) {
    // query the search provider
    $.get({
      url: searchURL,
    })
        .done((data) => {
          console.log(data);
          this.render(data);
        })
        .fail((xhr) => {
          const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
          openSimpleMessage(
              app.polyglot.t('search.errors.searchFailTitle', { provider: searchURL }),
              app.polyglot.t('search.errors.searchFailReason', { error: failReason })
          );
        });
  }

  get $resultsWrapper() {
    return this._$resultsWrapper ||
        (this._$resultsWrapper = this.$('.js-resultsWrapper'));
  }

  render(data) {
    loadTemplate('search/Search.html', (t) => {
      this.$el.html(t({
        ...data,
      }));
    });
    this._$resultsWrapper = null;

    return this;
  }
}
