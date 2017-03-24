import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import ListingCard from '../ListingCard';
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
      'click .js-pagNext': 'clickPagNext',
      'click .js-pagPrev': 'clickPagPrev',
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
    // create a user card
    return false;
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

    this.$resultsGrid.html(resultsFrag);
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

      const newPageCol = new ResultsCol(null, { searchURL: url });
      this.pageCollection[page] = newPageCol;

      newPageCol.fetch()
          .done((data) => {
            console.log(data);
          });
    }
  }

  render() {
    loadTemplate('search/Results.html', (t) => {
      this.$el.html(t());

      this.$resultsGrid = this.$('.js-resultsGrid');
      this.cardViews.forEach(vw => vw.remove());
      this.cardViews = [];
      this.loadPage();
    });

    return this;
  }
}
