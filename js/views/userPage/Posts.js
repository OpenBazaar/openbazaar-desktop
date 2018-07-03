import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Posts from '../posts/Posts';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Profile from '../../models/profile/Profile';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model || !(options.model instanceof Profile)) {
      throw new Error('Please provide a valid profile model.');
    }
    const opts = {
      ...options,
    };
    super(opts);
    this.options = opts;

    // create the posts here, so they're available for the fetch
    this.posts = this.createChild(Posts, {});

    $.get(app.getServerUrl(`ob/posts/${this.options.model.get('peerID')}`))
      .done(data => this.onPosts(data))
      .fail((jqXhr) => {
        // if (jqXhr.statusText === 'abort') return;
        // const failReason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
        // openSimpleMessage(
        //   app.polyglot.t('listingDetail.errors.fetchPosts'),
        //   failReason);
        this.onPosts({});
      });
  }

  className() {
    return 'userPagePosts';
  }

  onPosts(data) {
    const pData = data || {};
    pData.reverse();
    this.posts.posts = pData;
    console.log(pData);
    this.getCachedEl('.js-posts').append(this.posts.render().$el);
  }

  remove() {
    if (this.ratingsFetch) this.ratingsFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('userPage/posts.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    this.getCachedEl('.js-posts').append(this.posts.render().$el);

    return this;
  }
}
