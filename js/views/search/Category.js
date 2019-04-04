import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { capitalize } from '../../utils/string';
import ListingCard from '../components/ListingCard';
import ResultsCol from '../../collections/Results';
import { recordEvent } from '../../utils/metrics';
import { createSearchURL } from '../../utils/search';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this._search = {
      ...options.search,
    };

    this.viewType = this.options.viewType || 'grid';

    this.cardViews = [];
  }

  className() {
    return 'searchCategory searchResults flexColRow';
  }

  attributes() {
    return { style: 'margin-bottom: 50px' };
  }

  events() {
    return {
      'click .js-seeAll': 'clickSeeAll',
    };
  }

  clickSeeAll() {
    const category = this._search.filters ? 'cryptolisting' : this._search.q;
    recordEvent('Discover_SeeAllCategory', { category });
    this.trigger('seeAllCategory', { q: this._search.q, filters: this._search.filters });
  }

  createCardView(model) {
    const vendor = model.get('vendor') || {};
    const base = vendor.handle ? `@${vendor.handle}` : vendor.peerID;
    const options = {
      listingBaseUrl: `${base}/store/`,
      reportsUrl: this._search.provider.reportsUrl || '',
      searchUrl: this.searchUrl,
      model,
      vendor,
      onStore: false,
      viewType: this.viewType,
    };

    return this.createChild(ListingCard, options);
  }

  renderCards(models) {
    const resultsFrag = document.createDocumentFragment();

    models.forEach(model => {
      const cardVw = this.createCardView(model);

      if (cardVw) {
        this.cardViews.push(cardVw);
        cardVw.render().$el.appendTo(resultsFrag);
      }
    });

    this.$el.toggleClass('noResults', models.total < 1);

    this.getCachedEl('.js-resultsGrid').html(resultsFrag);

    // hide the loading spinner
    this.$el.removeClass('loading');
  }

  loadPage(options) {
    this.removeCardViews();

    const opts = {
      ...this._search,
      ...options,
    };

    const newUrl = createSearchURL(opts);

    this.trigger('loadingPage');

    this.$el.addClass('loading');

    const newPageCol = new ResultsCol();

    if (this.newPageFetch) this.newPageFetch.abort();

    this.newPageFetch = newPageCol.fetch({
      url: newUrl,
    })
      .done(() => {
        this.renderCards(newPageCol);
      })
      .fail((xhr) => {
        if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
      });
  }

  removeCardViews() {
    this.cardViews.forEach(vw => vw.remove());
    this.cardViews = [];
  }

  remove() {
    this.removeCardViews();
    if (this.newPageFetch) this.newPageFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('search/category.html', (t) => {
      this.$el.html(t({
        viewTypeClass: this.viewType === 'grid' ?
          '' : `listingsGrid${capitalize(this.viewType)}View`,
        viewType: this.viewType,
        title: this._search.filters.type === 'cryptocurrency' ? 'Trade' : this._search.q,
      }));

      this.removeCardViews();
      this.loadPage();
    });

    return this;
  }
}
