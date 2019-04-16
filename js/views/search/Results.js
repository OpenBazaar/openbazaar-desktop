import baseVw from '../baseVw';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { capitalize } from '../../utils/string';
import { recordEvent } from '../../utils/metrics';
import { createSearchURL } from '../../utils/search';
import UserCard from '../UserCard';
import ListingCard from '../components/ListingCard';
import PageControls from '../components/PageControlsTextStyle';
import ResultsCol from '../../collections/Results';
import ListingCardModel from '../../models/listing/ListingShort';
import ProviderMd from '../../models/search/SearchProvider';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.search) throw new Error('Please provide a search object.');
    if (!options.search.provider || !(options.search.provider instanceof ProviderMd)) {
      throw new Error('Please provide a provider model.');
    }

    const opts = {
      viewType: 'grid',
      setHistory: true,
      ...options,
      initialState: {
        loading: false,
        ...options.initialState,
      },
    };

    super(opts);
    this.options = opts;
    this._setHistory = opts.setHistory;
    this._search = {
      p: 0,
      ps: 66,
      ...options.search,
    };

    this.cardViews = [];
    this.pageCols = {};
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCols[this._search.p] = (options.initCol);
    this.loadPage();
  }

  className() {
    return 'searchResults flexColRow gutterV';
  }

  events() {
    return {
      'click .js-reset': 'clickResetBtn',
    };
  }

  clickResetBtn() {
    this.trigger('resetSearch');
  }

  createCardView(model) {
    // models can be listings or nodes, even though nodes aren't being used yet
    if (model instanceof ListingCardModel) {
      const vendor = model.get('vendor') || {};
      const base = vendor.handle ? `@${vendor.handle}` : vendor.peerID;
      const options = {
        listingBaseUrl: `${base}/store/`,
        reportsUrl: this._search.provider.reportsUrl || '',
        searchUrl: this._search.provider[this._search.urlType],
        model,
        vendor,
        onStore: false,
        viewType: this.options.viewType,
      };

      return this.createChild(ListingCard, options);
    }

    return this.createChild(UserCard, { model });
  }

  renderCards(pageCol = []) {
    const resultsFrag = document.createDocumentFragment();

    pageCol.forEach(model => {
      const cardVw = this.createCardView(model);

      if (cardVw) {
        this.cardViews.push(cardVw);
        cardVw.render().$el.appendTo(resultsFrag);
      }
    });

    this.getCachedEl('.js-resultsGrid').html(resultsFrag);
  }

  loadPage(options) {
    this.removeCardViews();
    this.trigger('loadingPage');
    this.setState({ loading: true });

    const opts = {
      ...this._search,
      ...options,
    };

    const newUrl = createSearchURL(opts);

    // if page exists, reuse it
    if (this.pageCols[opts.p]) {
      if (this._setHistory) {
        app.router.navigate(`search/listings?providerQ=${encodeURIComponent(newUrl)}`);
      }
      this.setState({ loading: false });
    } else {
      const newPageCol = new ResultsCol();
      this.pageCols[opts.p] = newPageCol;

      if (this.newPageFetch) this.newPageFetch.abort();

      this.newPageFetch = newPageCol.fetch({
        url: newUrl,
      })
        .done(() => {
          if (this._setHistory) {
            app.router.navigate(`search/listings?providerQ=${encodeURIComponent(newUrl)}`);
          }
        })
        .fail((xhr) => {
          if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
        })
        .always(() => {
          this.setState({ loading: false });
        });
    }
  }

  clickPagePrev() {
    recordEvent('Discover_PrevPage', { fromPage: this._search.p });
    this._search.p--;
    this._setHistory = true;
    this.loadPage();
  }

  clickPageNext() {
    recordEvent('Discover_NextPage', { fromPage: this._search.p });
    this._search.p++;
    this._setHistory = true;
    this.loadPage();
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
    const currentPage = Number(this._search.p) + 1;
    const pageCol = this.pageCols[this._search.p];

    loadTemplate('search/results.html', (t) => {
      this.$el.html(t({
        viewTypeClass: this.options.viewType === 'grid' ?
          '' : `listingsGrid${capitalize(this.options.viewType)}View`,
        viewType: this.options.viewType,
        ...this.getState(),
      }));

      if (this.pageControls) this.pageControls.remove();

      if (pageCol && pageCol.length) {
        this.renderCards(pageCol);

        this.pageControls = this.createChild(PageControls, {
          initialState: {
            currentPage,
            morePages: currentPage < Math.ceil(pageCol.total / this._search.ps),
          },
        });
        this.listenTo(this.pageControls, 'clickNext', this.clickPageNext);
        this.listenTo(this.pageControls, 'clickPrev', this.clickPagePrev);
        this.$('.js-pageControlsContainer').html(this.pageControls.render().el);
      }
    });

    return this;
  }
}
