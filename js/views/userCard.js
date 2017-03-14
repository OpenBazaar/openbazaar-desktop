import $ from 'jquery';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import { followedByYou, followUnfollow } from '../utils/follow';
import Profile from '../models/profile/Profile';
import UserCard from '../models/UserCard';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (this.model instanceof Profile) {
      this.guid = this.model.id;
      this.fetched = true;
    } else if (this.model) {
      this.guid = this.model.get('guid');
      this.fetched = false;
    } else {
      this.model = new UserCard({ guid: options.guid });
      this.guid = options.guid;
      this.fetched = false;
    }
    this.ownGuid = this.guid === app.profile.id;

    this.followedByYou = followedByYou(this.guid);

    this.loading = !this.fetched;

    this.listenTo(app.ownFollowing, 'sync update', () => {
      this.followedByYou = followedByYou(this.guid);
      this.$followBtn.toggleClass('active', this.followedByYou);
    });
  }

  get ownMod() {
    return app.settings.get('storeModerators').indexOf(this.guid) !== -1;
  }

  loadUser(guid = this.guid) {
    let profile;
    this.fetched = true;

    if (guid === app.profile.id) {
      // don't fetch our this user's own profile, since we have it already
      this.profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ id: guid });
      this.profileFetch = profile.fetch();
    }

    this.profileFetch.done(() => {
      if (this.isRemoved()) return;
      this.loading = false;
      this.notFound = false;
      this.model = profile;
      this.render();
    }).fail(() => {
      if (this.isRemoved()) return;
      this.loading = false;
      this.notFound = true;
      this.render();
    });
  }

  className() {
    return 'userCard';
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

    this.$followBtn.addClass('processing');
    followUnfollow(this.guid, type)
      .always(() => (this.$followBtn.removeClass('processing')));
  }

  modClick() {
    console.log('the mod button was clicked');
    // TODO: add code for adding and removing this user as a moderator
  }

  render() {
    loadTemplate('userCard.html', (t) => {
      this.$el.html(t({
        loading: this.loading,
        notFound: this.notFound,
        guid: this.guid,
        ownGuid: this.ownGuid,
        followedByYou: this.followedByYou,
        ownMod: this.ownMod,
        ...this.options,
        ...this.model.toJSON(),
      }));

      this.$followBtn = this.$('.js-follow');

      if (!this.fetched) this.loadUser();
      /* the view should be rendered when it is created and before it has data, so it can occupy
       space in the DOM while the data is being fetched. */
    });

    return this;
  }

  remove() {
    if (this.profileFetch && this.profileFetch.abort) this.profileFetch.abort();
  }
}
