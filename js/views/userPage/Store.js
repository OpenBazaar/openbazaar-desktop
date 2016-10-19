import loadTemplate from '../../utils/loadTemplate';
import Listings from '../../collections/Listings';
import BaseVw from '../baseVw';
import ListingShort from '../ListingShort';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      className: 'userPageStore',
      ...options,
    });

    this.listingShortViews = [];
    this.collection = new Listings();

    this.listenTo(this.collection, 'request', (cl, xhr) => {
      this.fetch = xhr;
      if (!this.retryPressed) this.render();

      const startTime = Date.now();

      xhr.always(() => {
        if (xhr.state() === 'rejected') {
          // if fetch is triggered by retry button and
          // it immediately fails, it looks like nothing happend,
          // so, we'll make sure it takes a minimum time.
          const callTime = Date.now() - startTime;

          if (callTime < 250) {
            setTimeout(() => {
              this.retryPressed = false;
              this.render();
            }, 250 - callTime);
          }
        } else {
          this.retryPressed = false;
          this.render();
        }
      });
    });

    this.collection.fetch();
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  onClickRetryFetch() {
    this.retryPressed = true;
    this.collection.fetch();
    this.$btnRetry.addClass('processing');
  }

  createListingShortView(opts = {}) {
    return this.createChild(ListingShort, opts);
  }

  get tabClass() {
    return 'store';
  }

  get $btnRetry() {
    return this._$btnRetry || this.$('.js-retryFetch');
  }

  render() {
    loadTemplate('userPage/userPageStore.html', (t) => {
      this.$el.html(t({
        listings: this.collection.toJSON(),
        isFetching: this.fetch.state() === 'pending',
        fetchFailed: this.fetch.state() === 'rejected',
        fetchFailReason: this.fetch.state() === 'rejected' &&
          this.fetch.responseText || '',
      }));
    });

    this._$btnRetry = null;

    this.listingShortViews.forEach(vw => vw.remove());
    this.listingShortViews = [];
    const listingsFrag = document.createDocumentFragment();

    this.collection.forEach(listingShort => {
      const listingShortVw = this.createListingShortView({
        model: listingShort,
      });

      this.listingShortViews.push(listingShortVw);
      listingShortVw.render().$el.appendTo(listingsFrag);
    });

    this.$('.js-listingsWrap').append(listingsFrag);

    return this;
  }
}
