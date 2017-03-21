import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import Search from '../../models/search/Search';
import app from '../../app';
import $ from 'jquery';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.sProvider = app.localSettings.get('searchProvider');
    this.sortBy = '';
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

  get sortByVal() {
    // return current sortBy state
  }

  get filterVals() {
    // return all currently active filters
  }

  processTerm(term) {
    console.log(term);
    const testForURL = /^((http|https|ob):\/\/)/;
    let searchQuery = '';
    if (testForURL.test(term)) {
      // assume term is a search provider query
      searchQuery = term;
    } else {
      const prepTerm = term.replace(/\s+/g, '+');
      const sortBy = this.sortBy ? `&sortBy=${this.sortBy}` : '';
      // todo: add filters and other
      searchQuery = `${this.sProvider}?q=${prepTerm}${sortBy}`;
    }

    this.callSearchProvider(searchQuery);
  }

  callSearchProvider() {
    // send
  }

  get $resultsWrapper() {
    return this._$resultsWrapper ||
        (this._$resultsWrapper = this.$('.js-resultsWrapper'));
  }

  render() {
    loadTemplate('search/Search.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });
    this._$resultsWrapper = null;

    return this;
  }
}
