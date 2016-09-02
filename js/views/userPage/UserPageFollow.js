import BaseVw from '../baseVw';
import userShort from '../userShort';
import app from '../../app';
import Follows from '../../collections/Followers';
import followUtils from '../../utils/follow';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.followType = options.followType;

    if (!options.ownPage) {
      this.followCol = new Follows(null, {
        type: this.followType.toLowerCase(),
        guid: this.model.id,
      });
      this.followCol.fetch().done(() => {
        this[`updateViewer${this.followType}`](true);
        this.render();
      });

      this.listenTo(app.ownFollowing, 'sync, update', () => {
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
        this.followCol.fetch().done(() => {
          this.render();
        }); // TODO: pagination
      } else {
        this.render();
      }

      this.listenTo(app[`own${this.followType}`], 'sync, update', () => {
        this.render();
      });
    }
  }

  updateViewerFollowers() {
    /* if the viewer follows/unfollows this user, add them to the followers list without a fetch */
    if (this.followType === 'Followers' && !this.options.ownPage) {
      // if the viewer has followed add them
      if (followUtils.followedByYou(this.model.id)) {
        this.followCol.add({ guid: app.profile.id });
        // if the viewer has unfollowed remove them
      } else if (!followUtils.followedByYou(this.model.id)) {
        this.followCol.remove(app.profile.id); // remove by id
      }
    }
  }

  updateViewerFollowing(viaAPI = false) {
    /* if the viewer is unfollowed or followed, update the following list */
    if (this.followType === 'Following' && !this.options.ownPage) {
      let followsYou;
      if (viaAPI) {
        // get via isFollowingMe API when it is ready
        console.log('update via API');
      } else {
        followsYou = followUtils.followsYou(this.model.id);
      }
      // if this page has followed the viewer add them
      if (followsYou) {
        this.followCol.add({ guid: app.profile.id });
        // if this page has unfollowed the viewer remove them
      } else if (!followsYou) {
        this.followCol.remove(app.profile.id); // remove by id
      }
    }
  }

  className() {
    return 'userPageFollow flexRow';
  }

  render() {
    this.$el.empty();
    // TODO: add pagination if the collection is Followers
    if (this.followCol.length) {
      this.followCol.forEach((follow) => {
        const user = this.createChild(userShort, {
          model: follow,
        });
        this.$el.append(user.render().$el);
      });
    } else {
      const noneString = app.polyglot.t(
        `userPage.no${this.options.ownPage ? 'Own' : ''}${this.followType}`,
        { name: this.model.get('name') });
      this.$el.append(`<h3 class="flexExpand txCtr">${noneString}</h3>`);
    }
    return this;
  }
}

