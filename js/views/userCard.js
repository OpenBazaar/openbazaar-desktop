import $ from 'jquery';
import _ from 'underscore';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import { followedByYou, followUnfollow } from '../utils/follow';
import Profile from '../models/profile/Profile';
import UserCard from '../models/UserCard';
import { launchModeratorDetailsModal } from '../utils/modalManager';
import { openSimpleMessage } from './modals/SimpleMessage';

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

    if (!this.guid) {
      if (this.model) {
        throw new Error('The guid must be provided in the model.');
      } else {
        throw new Error('The guid must be provided in the options.');
      }
    }

    this.ownGuid = this.guid === app.profile.id;
    this.followedByYou = followedByYou(this.guid);

    this.loading = !this.fetched;
    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => {
      app.settings.set(this.settings.toJSON());
    });

    this.listenTo(app.settings, 'change:storeModerators', () => {
      this.$modBtn.toggleClass('active', this.ownMod);
    });

    this.listenTo(app.ownFollowing, 'sync update', () => {
      this.followedByYou = followedByYou(this.guid);
      this.$followBtn.toggleClass('active', this.followedByYou);
    });
  }

  get ownMod() {
    return app.settings.ownMod(this.guid);
  }

  loadUser(guid = this.guid) {
    let profile;
    this.fetched = true;

    if (guid === app.profile.id) {
      // don't fetch our this user's own profile, since we have it already
      this.profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ peerID: guid });
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
    if (this.ownMod) {
      // remove this user from the moderator list
      this.$modBtn.addClass('processing');
      this.saveModeratorList(false);
    } else {
      // show the moderator details modal
      const modModal = launchModeratorDetailsModal({ model: this.model });
      this.listenTo(modModal, 'addAsModerator', () => {
        this.$modBtn.addClass('processing');
        this.saveModeratorList(true);
      });
    }
  }

  saveModeratorList(add = false) {
    // clone the array, otherwise it is a reference
    let modList = _.clone(app.settings.get('storeModerators'));

    if (add && !this.ownMod) {
      modList.push(this.guid);
    } else {
      modList = _.without(modList, this.guid);
    }

    const formData = { storeModerators: modList };
    this.settings.set(formData);

    if (!this.settings.validationError) {
      this.settings.save(formData, {
        attrs: formData,
        type: 'PATCH',
      })
        .fail((...args) => {
          const errMsg = args[0] && args[0].responseJSON &&
              args[0].responseJSON.reason || '';
          const phrase = add ? 'userShort.modAddError' : 'userShort.modRemoveError';
          openSimpleMessage(app.polyglot.t(phrase), errMsg);
        })
        .always(() => {
          this.$modBtn.removeClass('processing');
        });
    }
  }

  get $followBtn() {
    return this._$followBtn ||
        (this._$followBtn = this.$('.js-follow'));
  }

  get $modBtn() {
    return this._$modBtn ||
        (this._$modBtn = this.$('.js-mod'));
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

      this._$followBtn = null;
      this._$modBtn = null;

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
