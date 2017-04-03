import baseVw from '../baseVw';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import ListingCard from '../ListingCard';
import UserCard from '../userCard';
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

    this.cardViews = [];
    this.pageCollection = {};
    this.total = this.options.total || 0;
    this.morePages = !!this.options.morePages;
    this.serverPage = this.options.serverPage || 0;
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCollection[this.serverPage] = (options.initCol);
    this.currentPage = 0;
    this.pageSize = this.options.pageSize || 12; // this should be a multiple of 3
  }

  className() {
    return 'searchResults flexColRow gutterV';
  }

  events() {
    return {
      'click .js-pageNext': 'clickPageNext',
      'click .js-pagePrev': 'clickPagePrev',
    };
  }

  createCardView(model) {
    // models can be listings or nodes
    if (model instanceof ListingCardModel) {
      const vendor = model.get('vendor') || {};
      const listingBaseUrl = `${vendor.handle || vendor.guid}/store/`;
      const options = {
        listingBaseUrl,
        model,
        onStore: false,
      };

      // if (guid) {
      return this.createChild(ListingCard, options);
      // }
      // console.log('This listing result has no vendor data');
    }

    // the search should use a parameter to prevent profile results from coming in, the code below
    // should be fleshed out if/when we allow profiles as search results
    const options = {
      model,
    };

    return this.createChild(UserCard, options);
  }

  renderCards(models) {
    const resultsFrag = document.createDocumentFragment();
    const end = this.pageSize * (Number(this.serverPage) + 1) - (this.pageSize - models.length);
    const start = end - this.pageSize + 1;
    const total = models.total;
    this.morePages = models.morePages;

    models.forEach(model => {
      const cardVw = this.createCardView(model);

      if (cardVw) {
        this.cardViews.push(cardVw);
        cardVw.render().$el.appendTo(resultsFrag);
      }
    });

    this.$resultsGrid.html(resultsFrag);
    // update the pagination text
    this.$displayText.html(app.polyglot.t('search.displaying', { start, end, total }));
  }

  loadPage(page = this.serverPage, size = this.pageSize) {
    // if page exists, reuse it
    if (this.pageCollection[page]) {
      this.renderCards(this.pageCollection[page]);
    } else {
       // get the new page
      const url = new URL(this.searchURL);
      const params = new URLSearchParams(url.search);
      params.set('p', page);
      params.set('ps', size);
      const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
      const newPageCol = new ResultsCol();
      this.pageCollection[page] = newPageCol;

      newPageCol.fetch({
        url: newURL,
      })
          .done(() => {
            this.renderCards(newPageCol);
          });
    }
  }

  clickPagePrev() {
    if (this.serverPage > 0) {
      this.serverPage--;
      this.loadPage();
    }
  }

  clickPageNext() {
    if (this.morePages) {
      this.serverPage++;
      this.loadPage();
    }
  }

  render() {
    loadTemplate('search/Results.html', (t) => {
      this.$el.html(t());

      this.$resultsGrid = this.$('.js-resultsGrid');
      this.$displayText = this.$('.js-displayingText');
      this.cardViews.forEach(vw => vw.remove());
      this.cardViews = [];
      this.loadPage();
    });

    return this;
  }
}
