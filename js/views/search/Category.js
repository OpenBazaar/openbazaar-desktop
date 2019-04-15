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
    const opts = {
      viewType: 'grid',
      ...options,
      initialState: {
        loading: false,
        ...options,
      },
    };

    super(opts);
    this.options = opts;
    this._search = {
      p: 0,
      ps: 8,
      ...options.search,
    };

    if (this._search.filters.type === 'cryptocurrency' && this._search.q === '*') {
      this.cryptoTitle = 'Trade';
    }

    this.cardViews = [];
    this.loadCategory();
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
      viewType: this.options.viewType,
    };

    return this.createChild(ListingCard, options);
  }

  renderCards(collection = []) {
    const resultsFrag = document.createDocumentFragment();

    collection.forEach(model => {
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
    this.setState({ loading: true });

    const opts = {
      ...this._search,
      ...options,
    };

    if (this.catCol) this.catCol.reset();
    else this.catCol = new ResultsCol();

    if (this.categoryFetch) this.categoryFetch.abort();

    this.categoryFetch = this.catCol.fetch({
      url: createSearchURL(opts),
    })
      .done(() => {
        this.trigger('fetchComplete');
      })
      .fail(xhr => {
        if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
      })
      .always(() => {
        this.setState({ loading: false });
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
        viewTypeClass: this.options.viewType === 'grid' ?
          '' : `listingsGrid${capitalize(this.options.viewType)}View`,
        viewType: this.options.viewType,
        title: this.cryptoTitle || this._search.q,
        ...this.getState(),
      }));
      if (this.catCol && this.catCol.length) this.renderCards(this.catCol);
    });

    return this;
  }
}
