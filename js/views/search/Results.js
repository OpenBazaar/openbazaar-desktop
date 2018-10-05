import baseVw from '../baseVw';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { capitalize } from '../../utils/string';
import ListingCard from '../ListingCard';
import UserCard from '../UserCard';
import PageControls from '../components/PageControlsTextStyle';
import ListingCardModel from '../../models/listing/ListingShort';
import ResultsCol from '../../collections/Results';
import { recordEvent } from '../../utils/metrics';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.searchUrl = options.searchUrl;
    if (!this.searchUrl) {
      throw new Error('Please provide a search provider URL.');
    }

    this.serverPage = this.options.serverPage || 0;
    this.pageSize = this.options.pageSize || 24;
    this.reportsUrl = this.options.reportsUrl || '';
    this.viewType = this.options.viewType || 'grid';

    this.cardViews = [];
    this.pageCollections = {};
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCollections[this.serverPage] = (options.initCol);
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
      vendor.avatar = vendor.avatarHashes;
      const base = vendor.handle ?
        `@${vendor.handle}` : vendor.peerID;

      const options = {
        listingBaseUrl: `${base}/store/`,
        reportsUrl: this.reportsUrl,
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
    const end = this.pageSize * (Number(this.serverPage) + 1) - (this.pageSize - models.length);
    const total = models.total;
    let start = 0;
    if (total) start = this.pageSize * Number(this.serverPage) + 1;

    models.forEach(model => {
      const cardVw = this.createCardView(model);

      if (cardVw) {
        this.cardViews.push(cardVw);
        cardVw.render().$el.appendTo(resultsFrag);
      }
    });

    this.$el.toggleClass('noResults', total < 1);

    this.$resultsGrid.html(resultsFrag);
    // update the page controls
    this.pageControls.setState({
      start,
      end,
      total,
      currentPage: Number(this.serverPage) + 1,
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

  loadPage(page = this.serverPage, size = this.pageSize) {
    this.removeCardViews();
    // get the new page
    const url = new URL(this.searchUrl);
    const params = new URLSearchParams(url.search);
    params.set('p', page);
    params.set('ps', size);
    const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
    this.trigger('loadingPage');

    // if page exists, reuse it
    if (this.pageCollections[page]) {
      this.renderCards(this.pageCollections[page]);
      // update the address bar
      app.router.navigate(`search?providerQ=${encodeURIComponent(newURL)}`,
        { replace: this.firstRender });
    } else {
      // show the loading spinner
      this.$el.addClass('loading');

      const newPageCol = new ResultsCol();
      this.pageCollections[page] = newPageCol;

      if (this.newPageFetch) this.newPageFetch.abort();

      this.newPageFetch = newPageCol.fetch({
        url: newURL,
      })
          .done(() => {
            this.renderCards(newPageCol);
            // update the address bar
            app.router.navigate(`search?providerQ=${encodeURIComponent(newURL)}`,
              { replace: this.firstRender });
          })
          .fail((xhr) => {
            if (xhr.statusText !== 'abort') this.trigger('searchError', xhr);
          });
    }
  }

  clickPagePrev() {
    this.serverPage--;
    this.loadPage(this.serverPage);
    recordEvent('Discover_PrevPage');
  }

  clickPageNext() {
    this.serverPage++;
    this.loadPage(this.serverPage);
    recordEvent('Discover_NextPage');
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
      this.$displayText = this.$('.js-displayingText');
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
