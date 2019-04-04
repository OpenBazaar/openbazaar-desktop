import baseVw from '../baseVw';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { capitalize } from '../../utils/string';
import ListingCard from '../components/ListingCard';
import UserCard from '../UserCard';
import PageControls from '../components/PageControlsTextStyle';
import ListingCardModel from '../../models/listing/ListingShort';
import ResultsCol from '../../collections/Results';
import { recordEvent } from '../../utils/metrics';
import { createSearchURL } from '../../utils/search';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this._search = {
      p: 0,
      ps: 66,
      ...options.search,
    };

    this.viewType = this.options.viewType || 'grid';

    this.cardViews = [];
    this.pageCollections = {};
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCollections[this._search.p] = (options.initCol);
    this.firstRender = true;
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
    // models can be listings or nodes
    if (model instanceof ListingCardModel) {
      const vendor = model.get('vendor') || {};
      const base = vendor.handle ?
        `@${vendor.handle}` : vendor.peerID;

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

    return this.createChild(UserCard, { model });
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

    this.$resultsGrid.html(resultsFrag);

    // update the page controls
    const currentPage = Number(this._search.p) + 1;
    const lastPage = Math.ceil(models.total / this._search.ps);

    this.pageControls.setState({
      currentPage,
      morePages: currentPage < lastPage,
    });

    // hide the loading spinner
    this.$el.removeClass('loading');
    /*
    // disabled until an enter handler to added to the listing card
    // move focus to the first result. The timeout orders it after other operations.
    setTimeout(() => {
      this.$resultsGrid.find('.listingCard').filter(':first').focus();
    });
    */
  }

  loadPage(options) {
    this.removeCardViews();

    const opts = {
      ...this._search,
      ...options,
    };

    const newUrl = createSearchURL(opts);

    this.trigger('loadingPage');

    // if page exists, reuse it
    if (this.pageCollections[opts.p]) {
      this.renderCards(this.pageCollections[opts.p]);
      app.router.navigate(`search?providerQ=${encodeURIComponent(newUrl)}`,
        { replace: this.firstRender });
    } else {
      this.$el.addClass('loading');

      const newPageCol = new ResultsCol();
      this.pageCollections[opts.p] = newPageCol;

      if (this.newPageFetch) this.newPageFetch.abort();

      this.newPageFetch = newPageCol.fetch({
        url: newUrl,
      })
        .done(() => {
          this.renderCards(newPageCol);
          app.router.navigate(`search?providerQ=${encodeURIComponent(newUrl)}`,
            { replace: this.firstRender });
        })
        .fail((xhr) => {
          if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
        });
    }
  }

  clickPagePrev() {
    this._search.p--;
    this.loadPage();
    recordEvent('Discover_PrevPage', { fromPage: this._search.p });
  }

  clickPageNext() {
    this._search.p++;
    this.loadPage();
    recordEvent('Discover_NextPage', { fromPage: this._search.p });
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
    loadTemplate('search/results.html', (t) => {
      this.$el.html(t({
        viewTypeClass: this.viewType === 'grid' ?
          '' : `listingsGrid${capitalize(this.viewType)}View`,
        viewType: this.viewType,
      }));

      this.$resultsGrid = this.$('.js-resultsGrid');
      this.removeCardViews();

      if (this.pageControls) this.pageControls.remove();
      this.pageControls = this.createChild(PageControls);
      this.listenTo(this.pageControls, 'clickNext', this.clickPageNext);
      this.listenTo(this.pageControls, 'clickPrev', this.clickPagePrev);
      this.$('.js-pageControlsContainer').html(this.pageControls.render().el);

      this.loadPage();
    });
    this.firstRender = false;

    return this;
  }
}
