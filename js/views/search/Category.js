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

    this.viewType = options.viewType || 'grid';

    this._search = {
      ...options.search,
    };

    if (this._search.filters.type === 'cryptocurrency' && this._search.q === '*') {
      this.cryptoTitle = 'Trade';
    }

    this.cardViews = [];
  }

  className() {
    return 'searchCategory searchResults flexColRow';
  }

  events() {
    return {
      'click .js-seeAll': 'clickSeeAll',
    };
  }

  clickSeeAll() {
    recordEvent('Discover_SeeAllCategory', { category: this.cryptoTitle || this._search.q });
    this.trigger('seeAllCategory', { q: this._search.q, filters: this._search.filters });
  }

  createCardView(model) {
    const vendor = model.get('vendor') || {};
    const base = vendor.handle ? `@${vendor.handle}` : vendor.peerID;
    const options = {
      listingBaseUrl: `${base}/store/`,
      reportsUrl: this._search.provider.reportsUrl || '',
      searchUrl: this._search.provider[this._search.urlType],
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

    this.getCachedEl('.js-resultsGrid').html(resultsFrag);

    this.$el.removeClass('loading');
  }

  loadCategory(options) {
    this.removeCardViews();

    const opts = {
      ...this._search,
      ...options,
    };

    const newUrl = createSearchURL(opts);

    this.$el.addClass('loading');

    const catCol = new ResultsCol();

    if (this.categoryFetch) this.categoryFetch.abort();

    this.categoryFetch = catCol.fetch({
      url: newUrl,
    })
      .done(() => {
        this.trigger('fetchComplete');
        this.renderCards(catCol);
      })
      .fail((xhr) => {
      // TODO change this to an in-template error display
        if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
      });
  }

  removeCardViews() {
    this.cardViews.forEach(vw => vw.remove());
    this.cardViews = [];
  }

  remove() {
    this.removeCardViews();
    if (this.categoryFetch) this.categoryFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('search/category.html', (t) => {
      this.$el.html(t({
        viewTypeClass: this.viewType === 'grid' ?
          '' : `listingsGrid${capitalize(this.viewType)}View`,
        viewType: this.viewType,
        title: this.cryptoTitle || this._search.q,
      }));

      this.removeCardViews();
      this.loadCategory();
    });

    return this;
  }
}
