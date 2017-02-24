import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { followedByYou, followUnfollow } from '../../utils/follow';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.model = this.options.model;
    this.followedByYou = followedByYou(this.model.id);

    // update the follow button when this user is followed or unfollowed
    this.listenTo(app.ownFollowing, 'sync update', () => {
      this.followedByYou = followedByYou(this.model.id);
      if (this.followedByYou) {
        this.$followBtn.addClass('hide');
        this.$unFollowBtn.removeClass('hide');
      } else {
        this.$followBtn.removeClass('hide');
        this.$unFollowBtn.addClass('hide');
      }
    });
  }

  className() {
    return `${super.className()} moderatorDetails modalTop modalScrollPage modalNarrow`;
  }

  events() {
    return {
      'click .js-message': 'messageClick',
      'click .js-follow': 'followClick',
      'click .js-unFollow': 'unfollowClick',
      'click .js-addAsModerator': 'addAsModerator',
      ...super.events(),
    };
  }

  messageClick() {
    // TODO: wire this in after chat is working
    console.log('Message button clicked');
  }

  followClick() {
    this.$followBtn.addClass('processing');
    followUnfollow(this.model.id, 'follow')
        .always(() => (this.$followBtn.removeClass('processing')));
  }

  unfollowClick() {
    this.$unFollowBtn.addClass('processing');
    followUnfollow(this.model.id, 'unfollow')
        .always(() => (this.$unFollowBtn.removeClass('processing')));
  }

  addAsModerator() {
    this.trigger('addAsModerator');
    super.close();
  }

  render() {
    loadTemplate('modals/moderatorDetails.html', (t) => {
      this.$el.html(t({
        followedByYou: this.followedByYou,
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));
      super.render();

      this.$followBtn = this.$('.js-follow');
      this.$unFollowBtn = this.$('.js-unFollow');
    });

    return this;
  }
}

