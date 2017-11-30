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
    super(options);
    this.options = options;

    this.startIndex = options.startIndex || 0;
    this.initialPageSize = options.pageSize || 3;
    this.pageSize = options.pageSize || 10;
    this.options.async = options.async || false;
    this._reviewIDs = options.ratings || [];
    this.isListing = options.isListing;
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

  get reviewIDs() {
    return this._reviewIDs;
  }

  set reviewIDs(ids) {
    if (!Array.isArray(ids)) throw new Error('The Review ids must be an array.');

    this._reviewIDs = ids;
  }

  hideMoreBtn() {
    if (this.startIndex >= this.reviewIDs.length) {
      this.$loadMore.addClass('hide');
    }
  }

  appendError(error) {
    const msg = app.polyglot.t('listingDetail.errors.fetchReviews', { error });
    this.$errors.append(`<p><i class="ion-alert-circled"> ${msg}</p>`);
  }

  loadReviews(start = this.startIndex, pageSize = this.pageSize, async = this.options.async) {
    const revLength = this.reviewIDs.length;
    // if on the last page, only fetch the number of reviews that remain
    const ps = start + pageSize <= revLength ? pageSize : revLength - start;

    if (start < revLength) {
      this.$loadMoreBtn.addClass('processing');
      this.$errors.html('');
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
            this.$loadMoreBtn.removeClass('processing');
          } else {
            this.listenForReviews(data);
          }
          this.hideMoreBtn();
        })
        .fail((xhr) => {
          const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
          this.appendError(failReason);
          this.$errors.append(`<p>${failReason}</p>`);
          this.hideMoreBtn();
          this.$loadMoreBtn.removeClass('processing');
        });
    }
  }

  listenForReviews(data) {
    const socketID = data.id;
    // listen to the websocket for review data
    const serverSocket = getSocket();
    if (serverSocket) {
      this.listenTo(serverSocket, 'message', (event) => {
        const eventData = event.jsonData;
        if (eventData.id === socketID && this.reviewIDs.indexOf(eventData.ratingId !== -1)) {
          if (!eventData.error) {
            this.collection.add(eventData.rating.ratingData);
          } else {
            // add the error to the collection so it can be shown in place of the review
            this.collection.add(eventData);
          }
          if (this.collection.length >= this.startIndex) {
            this.$loadMoreBtn.removeClass('processing');
          }
        }
      });
    } else {
      throw new Error('There is no connection to the server to listen to.');
    }
  }

  addReview(model) {
    const newReview = new Review({
      model,
      isListing: this.isListing,
    });
    const newRevieEl = newReview.render().$el;
    const btnTxt = app.polyglot.t('listingDetail.review.showMore');
    const truncLines = model.get('buyerID') !== undefined ? 5 : 6;

    this.$reviewWrapper.append(newRevieEl);
    // truncate any review text that is too long
    newRevieEl.find('.js-reviewText').trunk8({
      fill: `… <button class="btnTxtOnly trunkLink js-showMore">${btnTxt}</button>`,
      lines: truncLines,
    });
  }

  clickLoadMore() {
    this.loadReviews(this.startIndex);
  }

  get $reviewWrapper() {
    return this._$reviewWrapper ||
      (this._$reviewWrapper = this.$('.js-reviewWrapper'));
  }

  get $loadMore() {
    return this._$loadMore ||
      (this._$loadMore = this.$('.js-loadMore'));
  }

  get $loadMoreBtn() {
    return this._$loadMoreBtn ||
      (this._$loadMoreBtn = this.$loadMore.find('.js-loadMoreBtn'));
  }

  get $errors() {
    return this._$errors ||
      (this._$errors = this.$('.js-errors'));
  }

  render() {
    loadTemplate('reviews/reviews.html', (t) => {
      this.$el.html(t({
        reviewsLength: this.reviewIDs.length,
      }));

      this._$reviewWrapper = null;
      this._$loadMore = null;
      this._$loadMoreBtn = null;
      this._$errors = null;
      this.loadReviews(this.startIndex, this.initialPageSize);
    });

    return this;
  }
}
