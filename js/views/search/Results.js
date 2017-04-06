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

    this.total = this.options.total || 0;
    this.morePages = !!this.options.morePages;
    this.serverPage = this.options.serverPage || 0;
    this.pageSize = this.options.pageSize || 12;

    this.cardViews = [];
    this.pageCollections = {};
    // if an initial collection was passed in, add it
    if (options.initCol) this.pageCollections[this.serverPage] = (options.initCol);
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
    let start = end - this.pageSize + 1;
    start = start > 0 ? start : 1;
    const total = models.total;
    this.morePages = models.morePages;
    // set the classes that control the button states
    this.$el.toggleClass('morePages', this.morePages);
    this.$el.toggleClass('firstPage', start === 1);

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
    // hide the loading spinner
    this.$el.removeClass('loading');
    // let the parent view know a new page has been loaded
    this.trigger('pageLoaded');
    // move focus to the first result
    this.$resultsGrid.find('.listingCard').filter(':first').focus();
  }

  loadPage(page = this.serverPage, size = this.pageSize) {
    // if page exists, reuse it
    if (this.pageCollections[page]) {
      this.renderCards(this.pageCollections[page]);
    } else {
      // show the loading spinner
      this.$el.addClass('loading');
       // get the new page
      const url = new URL(this.searchURL);
      const params = new URLSearchParams(url.search);
      params.set('p', page);
      params.set('ps', size);
      const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
      const newPageCol = new ResultsCol();
      this.pageCollections[page] = newPageCol;

      newPageCol.fetch({
        url: newURL,
      })
          .done(() => {
            this.renderCards(newPageCol);
          })
          .fail((xhr) => {
            this.trigger('searchError', xhr);
          });
    }
  }

  clickPagePrev(e) {
    if (this.serverPage > 0) {
      this.serverPage--;
      this.loadPage();
    }
  }

  clickPageNext(e) {
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
