import $ from 'jquery';
import _ from 'underscore';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { getSocket } from '../../utils/serverConnect';
import app from '../../app';
import Post from './Post';
import 'trunk8';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };
    super(opts);
    this.options = opts;
  }

  className() {
    return 'posts';
  }

  events() {
    return {
      'click .js-loadMoreBtn': 'clickLoadMore',
    };
  }



  hideMoreBtn() {
    if (this.startIndex >= this.postIDs.length) {
      this.getCachedEl('.js-loadMore').addClass('hide');
    }
  }

  appendError(error) {
    const msg = app.polyglot.t('listingDetail.errors.fetchPosts', { error });
    this.getCachedEl('.js-errors').append(`<p><i class="ion-alert-circled"> ${msg}</p>`);
  }

  addPosts() {
    if(this.posts) {
      this.posts.forEach((p) => {
        this.addPost(p);
      })
    }
  }

  addPost(p) {
    const newPost = new Post({});
    newPost.title = p.title;
    newPost.images = p.images;

    $('.js-posts').append(newPost.render().$el);
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

    this.addPosts();

    return this;
  }
}
