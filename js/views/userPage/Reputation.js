import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Reviews from '../reviews/Reviews';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Profile from '../../models/profile/Profile';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model || !(options.model instanceof Profile)) {
      throw new Error('Please provide a valid profile model.');
    }
    const opts = {
      ...options,
      initialState: {
        isFetching: true,
        ...options.initialState || {},
      },
    };
    super(opts);
    this.options = opts;

    // create the reviews here, so they're available for the fetch
    this.reviews = this.createChild(Reviews, {
      async: true,
      initialPageSize: 5,
      pageSize: 5,
      initialState: {
        isFetchingRatings: true,
      },
    });

    // fetch the ratings immediately. They are asyncronous, and should not be refetched
    // if the view re-renders.
    this.ratingsFetch =
      $.get(app.getServerUrl(`ob/ratings/${this.options.model.get('peerID')}`))
        .done(data => this.onRatings(data))
        .fail((jqXhr) => {
          if (jqXhr.statusText === 'abort') return;
          const failReason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
          openSimpleMessage(
            app.polyglot.t('listingDetail.errors.fetchRatings'),
            failReason);
        });
  }

  className() {
    return 'userPageReputation';
  }

  onRatings(data) {
    const pData = data || {};
    this.setState({
      isFetching: false,
      ...pData,
    });
    this.reviews.reviewIDs = pData.ratings || [];
    this.reviews.setState({ isFetchingRatings: false });
  }

  remove() {
    if (this.ratingsFetch) this.ratingsFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('userPage/reputation.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
      this.delegateEvents(this.reviews);
      this.getCachedEl('.js-reviews').append(this.reviews.render().$el);
    });

    return this;
  }
}

