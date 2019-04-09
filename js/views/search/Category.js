import is from 'is_js';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { capitalize } from '../../utils/string';
import { recordEvent } from '../../utils/metrics';
import { createSearchURL } from '../../utils/search';
import ListingCard from '../components/ListingCard';
import ResultsCol from '../../collections/Results';
import ProviderMd from '../../models/search/SearchProvider';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.search) throw new Error('Please provide a search object.');
    if (!options.search.provider || !(options.search.provider instanceof ProviderMd)) {
      throw new Error('Please provide a provider model.');
    }

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
      searchUrl: this._search.provider.listingsUrl,
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
  }

  loadCategory(options) {
    this.removeCardViews();
    this.$el.addClass('loading');
    const catCol = new ResultsCol();

    if (this.categoryFetch) this.categoryFetch.abort();

    this.categoryFetch = catCol.fetch({
      url: createSearchURL(options),
    })
      .done(() => {
        this.trigger('fetchComplete');
        this.renderCards(catCol);
      })
      .fail(xhr => {
        if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
      })
      .always(() => {
        this.$el.removeClass('loading');
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

      this.loadCategory(this._search);
    });

    return this;
  }
}
