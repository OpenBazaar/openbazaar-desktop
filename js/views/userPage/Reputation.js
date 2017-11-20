import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Reviews from '../modals/listingDetail/Reviews';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Profile from '../../models/profile/Profile';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model && !(options.model instanceof Profile)) {
      throw new Error('Please provide a valid profile model.');
    }
    super(options);

    this.ratingsFetch =
      $.get(app.getServerUrl(`ob/ratings/${options.model.get('peerID')}`))
        .done(data => this.onRatings(data))
        .fail((jqXhr) => {
          if (jqXhr.statusText === 'abort') return;
          const failReason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
          openSimpleMessage(
            app.polyglot.t('listingDetail.errors.fetchRatings'),
            failReason);
        });

    this.reviews = this.createChild(Reviews, {
      async: true,
      pageSize: 5,
    });
  }

  className() {
    return 'userPageReputation';
  }

  events() {
    return {
      // 'click .js-tab': 'tabClick',
    };
  }

  onRatings(data) {
    console.log(data)
    const pData = data || {};
    this.setState({
      ...pData,
    });
    this.reviews.reviewIDs = pData.ratings || [];
    this.reviews.render();
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

