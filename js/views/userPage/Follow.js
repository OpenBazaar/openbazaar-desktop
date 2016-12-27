import BaseVw from '../baseVw';
import userShort from '../userShort';
import app from '../../app';
import Follows from '../../collections/Followers';
import { followedByYou, followsYou } from '../../utils/follow';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.followType = options.followType;
    this.userCache = [];

    if (!options.ownPage) {
      this.followCol = new Follows(null, {
        type: this.followType.toLowerCase(),
        guid: this.model.id,
      });
      this.followCol.fetch().done(() => {
        this[`updateViewer${this.followType}`](true);
        this.render();
      });

      this.listenTo(app.ownFollowing, 'update', () => {
        this.updateViewerFollowers();
        this.render();
      });

      this.listenTo(app.ownFollowers, 'update', () => {
        this.updateViewerFollowing();
        this.render();
      });
    } else {
      this.followCol = app[`own${this.followType}`];
      if (this.followType === 'Followers') {
        this.followCol.fetch(); // TODO: pagination
      }

      this.listenTo(app[`own${this.followType}`], 'update', () => {
        this.render();
      });
    }
  }

  updateViewerFollowers() {
    /* if the viewer follows/unfollows this user, add them to the followers list without a fetch */
    if (this.followType === 'Followers' && !this.options.ownPage) {
      // if the viewer has followed add them
      if (followedByYou(this.model.id)) {
        this.followCol.unshift({ guid: app.profile.id });
        // if the viewer has unfollowed remove them
      } else if (!followedByYou(this.model.id)) {
        this.followCol.remove(app.profile.id); // remove by id
      }
    }
  }

  updateViewerFollowing(viaAPI = false) {
    /* if the viewer is unfollowed or followed, update the following list */
    if (this.followType === 'Following' && !this.options.ownPage) {
      let isFollowingYou;
      if (viaAPI) {
        // get via isFollowingMe API when it is ready
        console.log('update via API');
      } else {
        isFollowingYou = followsYou(this.model.id);
      }
      // if this page has followed the viewer add them
      if (isFollowingYou) {
        this.followCol.unshift({ guid: app.profile.id });
        // if this page has unfollowed the viewer remove them
      } else if (!isFollowingYou) {
        this.followCol.remove(app.profile.id); // remove by id
      }
    }
  }

  className() {
    return 'userPageFollow flexRow';
  }

  render() {
    this.$el.empty();
    this.userCache.forEach((user) => {
      user.remove();
    });
    this.userCache = [];
    // TODO: add pagination if the collection is Followers
    if (this.followCol.length) {
      this.followCol.forEach((follow) => {
        const user = this.createChild(userShort, {
          model: follow,
        });
        this.userCache.push(user);
        this.$el.append(user.render().$el);
      });
    } else {
      const noneString = app.polyglot.t(
        `userPage.no${this.options.ownPage ? 'Own' : ''}${this.followType}`,
        { name: this.model.get('name') });
      const noneStringPartial1 = '<div class="col12 txCtr padLg contentBox clrBr clrP">';
      this.$el.append(`${noneStringPartial1}<h3 class="flexExpand txCtr">${noneString}</h3></div>`);
    }
    return this;
  }
}

