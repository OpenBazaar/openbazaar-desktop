import $ from 'jquery';
import _ from 'underscore';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import { followedByYou, followUnfollow } from '../utils/follow';
import Profile from '../models/profile/Profile';
import { launchModeratorDetailsModal } from '../utils/modalManager';
import { openSimpleMessage } from './modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (this.model instanceof Profile) {
      this.guid = this.model.id;
      this.fetched = true;
    } else {
      this.guid = options.guid || this.model.get('guid');
      this.fetched = false;
    }
    this.ownGuid = this.guid === app.profile.id;
    this.followedByYou = followedByYou(this.guid);

    this.loading = !this.fetched;
    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => {
      app.settings.set(this.settings.toJSON());
      this.$modBtn.toggleClass('active', this.ownMod);
    });

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
    let modList = app.settings.get('storeModerators');

    if (add && !this.ownMod) {
      modList.push(this.guid);
    } else {
      modList = _.without(modList, this.guid);
    }

    const formData = { storeModerators: modList };
    this.settings.set(formData);

    if (!this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('settings.storeTab.status.saving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      this.settings.save(formData, {
        attrs: formData,
        type: 'PATCH',
      })
          .done(() => {
            statusMessage.update({
              msg: app.polyglot.t('settings.storeTab.status.done'),
              type: 'confirmed',
            });
          })
          .fail((...args) => {
            const errMsg = args[0] && args[0].responseJSON &&
                args[0].responseJSON.reason || '';
            openSimpleMessage(app.polyglot.t('settings.storeTab.status.error'), errMsg);

            statusMessage.update({
              msg: app.polyglot.t('settings.storeTab.status.fail'),
              type: 'warning',
            });
          })
          .always(() => {
            this.$modBtn.removeClass('processing');
            setTimeout(() => statusMessage.remove(), 3000);
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
