import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { followedByYou, followUnfollow } from '../../utils/follow';
import Profile from '../../models/profile/Profile';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.asyncCalls = [];

    if (!this.model || !(this.model instanceof Profile)) {
      throw new Error('Please provide a Profile model.');
    }

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
    const followAsync = followUnfollow(this.model.id, 'follow')
        .always(() => {
          if (this.isRemoved()) return;
          this.$followBtn.removeClass('processing');
        });
    this.asyncCalls.push(followAsync);
  }

  unfollowClick() {
    this.$unFollowBtn.addClass('processing');
    const unfollowAsync = followUnfollow(this.model.id, 'unfollow')
        .always(() => {
          if (this.isRemoved()) return;
          this.$unFollowBtn.removeClass('processing');
        });
    this.asyncCalls.push(unfollowAsync);
  }

  addAsModerator() {
    this.trigger('addAsModerator');
    this.close();
  }

  remove() {
    this.asyncCalls.forEach(call => call.abort());
    super.remove();
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

