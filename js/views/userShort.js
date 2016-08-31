import $ from 'jquery';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import Profile from '../models/Profile';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.guid = options.guid || this.model.get('guid');
    this.ownGuid = this.guid === app.profile.id;
    this.profileArgs = {}; // create blank for placeholder render
    this.followsYou = app.ownFollowers.get(this.guid) !== undefined;
    this.followedByYou = app.ownFollowing.get(this.guid) !== undefined;
    // TODO: add in code to determine if this user is in the viewer's moderator list
    this.ownMod = false;

    this.loadUser();
    /* the view should be rendered when it is created and before it has data, so it can occupy
       space in the DOM while the data is being fetched. */
  }

  loadUser(guid = this.guid) {
    let profile;
    let profileFetch;

    this.loading = true;

    if (guid === app.profile.id) {
      // don't fetch our this user's own profile, since we have it already
      profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ id: guid });
      profileFetch = profile.fetch();
    }

    profileFetch.done(() => {
      this.loading = false;
      this.notFound = false;
      this.profileArgs = profile.toJSON();
      this.render();
    }).fail(() => {
      this.loading = false;
      this.notFound = true;
      this.render();
    });
  }

  className() {
    return 'userShort';
  }

  events() {
    return {
      'click .js-userName': 'nameClick',
      'click .js-follow': 'followClick',
      'click .js-mod': 'modClick',
    };
  }

  nameClick() {
    app.router.navigate(`${this.guid}`, {
      trigger: true,
    });
  }

  followClick() {
    const type = this.followedByYou ? 'unfollow' : 'follow';

    app.followUnfollow(this.guid, type);
  }

  modClick() {
    console.log('the mod button was clicked');
    // TODO: add code for adding and removing this user as a moderator
  }

  render() {
    loadTemplate('userShort.html', (t) => {
      this.$el.html(t({
        loading: this.loading,
        notFound: this.notFound,
        guid: this.guid,
        ownGuid: this.ownGuid,
        followsYou: this.followsYou,
        followedByYou: this.followedByYou,
        ownMod: this.ownMod,
        ...this.profileArgs,
      }));
    });

    return this;
  }
}
