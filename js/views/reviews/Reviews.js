import $ from 'jquery';
import _ from 'underscore';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { getSocket } from '../../utils/serverConnect';
import app from '../../app';
import Collection from '../../collections/Reviews';
import Review from './Review';
import 'trunk8';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        isFetchingRatings: false, // pass in true if ratings are provided after the first render
        ...options.initialState || {},
      },
    };
    super(opts);
    this.options = opts;

    this.startIndex = this.options.startIndex || 0;
    this.initialPageSize = this.options.pageSize || 3;
    this.pageSize = this.options.pageSize || 10;
    this._reviewIDs = this.options.ratings || [];
    this.showListingData = this.options.showListingData;
    this.collection = new Collection();
    this.listenTo(this.collection, 'add', model => this.addReview(model));
  }

  className() {
    return 'reviews';
  }

  events() {
    return {
      'click .js-loadMoreBtn': 'clickLoadMore',
    };
  }

  onSocketMessage(event) {
    const eventData = event.jsonData || {};
    if (this.reviewIDs && this.reviewIDs.indexOf(eventData.ratingId) !== -1) {
      if (!eventData.error) {
        this.collection.add(eventData.rating.ratingData);
      } else {
        // add the error to the collection so it can be shown in place of the review
        this.collection.add(eventData);
      }
      if (this.collection.length >= this.startIndex) {
        this.getCachedEl('.js-loadMoreBtn').removeClass('processing');
      }
    }
  }

  listenForReviews() {
    if (!this.reviewIDs.length) return;

    const serverSocket = getSocket();

    if (serverSocket) {
      this.stopListening(serverSocket, null, this.onSocketMessage);
      this.listenTo(serverSocket, 'message', this.onSocketMessage);
    } else {
      throw new Error('There is no connection to the server to listen to.');
    }
  }

  get reviewIDs() {
    return this._reviewIDs;
  }

  set reviewIDs(ids) {
    if (!Array.isArray(ids)) throw new Error('The Review ids must be an array.');

    this._reviewIDs = ids;
    if (this.options.async) {
      this.listenForReviews();
    }
  }

  hideMoreBtn() {
    if (this.startIndex >= this.reviewIDs.length) {
      this.getCachedEl('.js-loadMore').addClass('hide');
    }
  }

  appendError(error) {
    const msg = app.polyglot.t('listingDetail.errors.fetchReviews', { error });
    this.getCachedEl('.js-errors').append(`<p><i class="ion-alert-circled"> ${msg}</p>`);
  }

  loadReviews(start = this.startIndex, pageSize = this.pageSize, async = !!this.options.async) {
    const revLength = this.reviewIDs.length;
    // if on the last page, only fetch the number of reviews that remain
    const ps = start + pageSize <= revLength ? pageSize : revLength - start;

    if (start < revLength) {
      this.getCachedEl('.js-loadMoreBtn').addClass('processing');
      this.getCachedEl('.js-errors').html('');
      $.ajax({
        url: app.getServerUrl(`ob/fetchratings?async=${async}`),
        data: JSON.stringify(this.reviewIDs.slice(start, start + ps)),
        dataType: 'json',
        contentType: 'application/json',
        type: 'POST',
      })
        .done(data => {
          this.startIndex = start + ps;
          if (!async) {
            this.collection.add(_.pluck(data, 'ratingData'));
            this.getCachedEl('.js-loadMoreBtn').removeClass('processing');
          }
          this.hideMoreBtn();
        })
        .fail((xhr) => {
          const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
          this.appendError(failReason);
          this.getCachedEl('.js-errors').append(`<p>${failReason}</p>`);
          this.hideMoreBtn();
          this.getCachedEl('.js-loadMoreBtn').removeClass('processing');
        });
    }
  }

  addReview(model) {
    const newReview = new Review({
      model,
      showListingData: this.showListingData,
    });
    const newRevieEl = newReview.render().$el;
    const btnTxt = app.polyglot.t('listingDetail.review.showMore');
    const truncLines = model.get('buyerID') !== undefined ? 5 : 6;

    this.getCachedEl('.js-reviewWrapper').append(newRevieEl);
    this.getCachedEl('.js-reviewWrapper').removeClass('hide');
    this.getCachedEl('.js-reviewsSpinner').addClass('hide');
    if (this.startIndex < this.reviewIDs.length) {
      this.getCachedEl('.js-loadMore').removeClass('hide');
    }

    // truncate any review text that is too long
    newRevieEl.find('.js-reviewText').trunk8({
      fill: `… <button class="btnTxtOnly trunkLink js-showMore">${btnTxt}</button>`,
      lines: truncLines,
    });
  }

  clickLoadMore() {
    this.loadReviews(this.startIndex);
  }

  render() {
    super.render();
    loadTemplate('reviews/reviews.html', (t) => {
      this.$el.html(t({
        reviewsLength: this.reviewIDs.length,
        collectionLength: this.collection.length,
        ...this.getState(),
      }));

      // render any reviews that have already loaded
      this.collection.each(review => this.addReview(review));

      // load the reviews when data is available and the collection is empty
      if (this.reviewIDs.length && !this.collection.length) {
        this.loadReviews(this.startIndex, this.initialPageSize);
      }
    });

    return this;
  }
}
