import $ from 'jquery';
import baseVw from '../baseVw';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import ListingCard from '../ListingCard';
import UserCard from '../UserCard';
import PageControls from '../components/PageControls';
import ListingCardModel from '../../models/listing/ListingShort';
import ResultsCol from '../../collections/Results';


export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.searchURL = options.searchURL;
    if (!this.searchURL) {
      throw new Error('Please provide a search provider URL.');
    }

    this.serverPage = this.options.serverPage || 0;
    this.pageSize = this.options.pageSize || 12;

    this.cardViews = [];
    this.pageCollections = {};
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCollections[this.serverPage] = (options.initCol);
    this.firstRender = true;
  }

  className() {
    return 'searchResults flexColRow gutterV';
  }

  createCardView(model) {
    // models can be listings or nodes
    if (model instanceof ListingCardModel) {
      const vendor = model.get('vendor') || {};
      vendor.avatar = vendor.avatarHashes;
      const listingBaseUrl = `${vendor.handle || vendor.peerID}/store/`;
      const options = {
        listingBaseUrl,
        model,
        vendor,
        onStore: false,
      };

      return this.createChild(ListingCard, options);
    }
    const options = {
      model,
    };

    return this.createChild(UserCard, options);
  }

  renderCards(models) {
    const resultsFrag = document.createDocumentFragment();
    const end = this.pageSize * (Number(this.serverPage) + 1) - (this.pageSize - models.length);
    let start = 0;
    const total = models.total;
    const noResults =
              $(`<h2 class='width100 padLg txCtr'>${app.polyglot.t('search.noResults')}</h2>`);

    if (total) {
      start = end >= this.pageSize ? end - this.pageSize + 1 : 1;
    }

    models.forEach(model => {
      const cardVw = this.createCardView(model);

      if (cardVw) {
        this.cardViews.push(cardVw);
        cardVw.render().$el.appendTo(resultsFrag);
      }
    });

    // if there are no models, add the no models message instead
    if (total < 1) noResults.appendTo(resultsFrag);

    this.$resultsGrid.html(resultsFrag);
    // update the page controls
    // this.$displayText.html(app.polyglot.t('search.displaying', { start, end, total }));
    this.pageControls.setState({ start, end, total });
    // hide the loading spinner
    this.$el.removeClass('loading');
    // move focus to the first result
    this.$resultsGrid.find('.listingCard').filter(':first').focus();
  }

  loadPage(page = this.serverPage, size = this.pageSize) {
    // get the new page
    const url = new URL(this.searchURL);
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
  }

  clickPageNext() {
    this.serverPage++;
    this.loadPage(this.serverPage);
  }

  remove() {
    if (this.newPageFetch) this.newPageFetch.abort();
    super.remove();
  }


  render() {
    loadTemplate('search/Results.html', (t) => {
      this.$el.html(t());

      this.$resultsGrid = this.$('.js-resultsGrid');
      this.$displayText = this.$('.js-displayingText');
      this.cardViews.forEach(vw => vw.remove());
      this.cardViews = [];

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
