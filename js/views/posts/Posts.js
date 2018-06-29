import $ from 'jquery';
// import _ from 'underscore';
import BaseVw from '../baseVw';
// import loadTemplate from '../../utils/loadTemplate';
// import { getSocket } from '../../utils/serverConnect';
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

  appendError(error) {
    const msg = app.polyglot.t('listingDetail.errors.fetchPosts', { error });
    this.getCachedEl('.js-errors').append(`<p><i class="ion-alert-circled"> ${msg}</p>`);
  }

  addPosts() {
    if (this.posts) {
      this.posts.forEach((p) => {
        this.addPost(p);
      });
    }
  }

  addPost(p) {
    const newPost = new Post({});
    newPost.title = p.title;
    newPost.images = p.images;

    $('.js-posts').append(newPost.render().$el);
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
