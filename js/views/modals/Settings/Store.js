import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import { getGuid } from '../../../utils';
import baseVw from '../../baseVw';
import Moderators from '../../../collections/Moderators';
import Profile from '../../../models/profile/Profile';
import ModCard from '../../moderatorCard';
import { openSimpleMessage } from '../SimpleMessage';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsStore',
      ...options,
    });

    this.profile = app.profile.clone();
    this.settings = app.settings.clone();
    this.currentMods = this.settings.get('storeModerators');

    this.modsSelected = new Moderators(null, {
      type: 'fetchprofiles',
      async: true,
    });

    if (this.currentMods.length) {
      // get the current moderator data using POST
      this.modsSelected.fetch({
        data: JSON.stringify(this.currentMods),
        type: 'POST',
      });
    }

    this.modsByID = new Moderators(null);

    this.modsAvailable = new Moderators(null, {
      async: true,
      include: 'profile',
      excludeList: this.currentMods,
    });

    this.listenTo(this.modsSelected, 'update', () => {
      this.buildModList(this.modsSelected, this.$modListSelected);
    });

    this.listenTo(this.modsByID, 'update', () => {
      this.buildModList(this.modsByID, this.$modListByID);
    });

    this.listenTo(this.modsAvailable, 'update', () => {
      this.buildModList(this.modsAvailable, this.$modListAvailable);
    });

    this.listenTo(this.profile, 'sync', () => app.profile.set(this.profile.toJSON()));
    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toJSON()));
  }

  events() {
    return {
      'click .js-browseMods': 'fetchAvailableModerators',
      'click .js-submitModByID': 'clickSubmitModByID',
      'click .js-save': 'save',
    };
  }

  fetchAvailableModerators() {
    // be aware that this call can take a long time
    this.$browseMods.addClass('processing');
    this.modsAvailable.fetch()
      .fail((...args) => {
        const title = app.polyglot.t('settings.storeTab.errors.availableModsFailed');
        const message = args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';
        openSimpleMessage(title, message);
      })
      .always(() => {
        setTimeout(() => {
          // when moderators are added via the async call, this button will be hidden.
          // remove the processing class after a long enough time. If it's still visible
          // there are probably no moderators coming.
          this.$browseMods.removeClass('processing');
        }, 30000);
      });
  }

  buildModList(collection, target) {
    // clear any existing content
    target.children().not('.js-noModsAdded').remove();
    target.toggleClass('hasMods', !!collection.length);

    if (collection.length) {
      const docFrag = $(document.createDocumentFragment());
      collection.each((moderator) => {
        const newMod = this.createChild(ModCard, {
          model: moderator,
        });
        this.listenTo(newMod, 'changeModerator', (data) => this.changeMod(data));
        docFrag.append(newMod.render().$el);
      });
      target.append(docFrag);
    }
  }

  clickSubmitModByID() {
    const modID = this.$submitModByIDInput.val();
    const blankError = app.polyglot.t('settings.storeTab.errors.modIsBlank');

    this.$submitModByIDInputError.addClass('hide');

    if (modID) {
      this.$submitModByID.addClass('processing');
      this.processIDorHandle(modID);
    } else {
      this.$submitModByIDInputError.removeClass('hide');
      this.$submitModByIDInputErrorText.text(blankError);
    }
  }

  processIDorHandle(modID) {
    if (modID.charAt(0) === '@') {
      // if the id is a handle, get the guid
      const handle = modID.slice(1);
      getGuid(handle)
          .done((guid) => {
            this.loadModByID(guid);
          })
          .fail(() => {
            this.modNotFound(modID, handle);
            this.$submitModByID.removeClass('processing');
          });
    } else {
      this.loadModByID(modID);
    }
  }

  loadModByID(guid, handle = '') {
    const addedError = app.polyglot.t('settings.storeTab.errors.modAlreadyAdded');
    const badModError = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });

    this.$submitModByIDInputError.addClass('hide');

    if (this.currentMods.indexOf(guid) === -1) {
      const mod = new Profile({ id: guid });
      mod.fetch()
          .done(() => {
            this.modsByID.add(mod);
            this.currentMods.push(guid);
            this.$submitModByIDInput.val('');
          })
          .fail(() => {
            this.showModByIDError(badModError);
          })
          .always(() => {
            this.$submitModByID.removeClass('processing');
          });
    } else {
      this.showModByIDError(addedError);
    }
  }

  showModByIDError(msg) {
    this.$submitModByIDInputError.removeClass('hide');
    this.$submitModByIDInputErrorText.text(msg);
    this.$submitModByIDInput.val('');
    this.$submitModByID.removeClass('processing');
  }

  changeMod(data) {
    if (data.selected) {
      this.currentMods = _.union(this.currentMods, [data.guid]);
    } else {
      this.currentMods = _.without(this.currentMods, data.guid);
    }
  }

  getProfileFormData(subset = this.$profileFormFields) {
    return super.getFormData(subset);
  }

  getSettingsData() {
    return { storeModerators: this.currentMods };
  }

  save() {
    // this view saves to two different models
    const profileFormData = this.getProfileFormData();
    const settingsFormData = this.getSettingsData();

    this.profile.set(profileFormData);
    this.settings.set(settingsFormData);

    if (!this.profile.validationError && !this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('settings.storeTab.status.saving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      const profileSave = this.profile.save(profileFormData, {
        attrs: profileFormData,
        type: 'PATCH',
      });

      const settingsSave = this.settings.save(settingsFormData, {
        attrs: settingsFormData,
        type: 'PATCH',
      });

      $.when(profileSave, settingsSave)
        .done(() => {
          // both have saved
          statusMessage.update({
            msg: app.polyglot.t('settings.storeTab.status.done'),
            type: 'confirmed',
          });
        })
        .fail((...args) => {
          // if at least one save fails, the save has failed.
          const errMsg = args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';

          openSimpleMessage(app.polyglot.t('settings.storeTab.status.error'), errMsg);

          statusMessage.update({
            msg: app.polyglot.t('settings.storeTab.status.fail'),
            type: 'warning',
          });
        })
        .always(() => {
          this.$btnSave.removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
    }

    // render so errrors are shown / cleared
    this.render();

    if (!this.profile.validationError && !this.settings.validationError) {
      this.$btnSave.addClass('processing');
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  get $modListSelected() {
    return this._$modListSelected ||
      (this._$modListSelected = this.$('.js-modListSelected'));
  }

  get $modListByID() {
    return this._$modListByID ||
      (this._$modListByID = this.$('.js-modListByID'));
  }

  get $modListAvailable() {
    return this._$modListAvailable ||
      (this._$modListAvailable = this.$('.js-modListAvailable'));
  }

  get $browseMods() {
    return this._$browseMods ||
      (this._$browseMods = this.$('.js-browseMods'));
  }

  get $submitModByIDInput() {
    return this._$submitModByIDInput ||
      (this._$submitModByIDInput = this.$('.js-submitModByIDInput'));
  }

  get $submitModByID() {
    return this._$submitModByID ||
        (this._$submitModByID = this.$('.js-submitModByID'));
  }

  get $submitModByIDInputError() {
    return this._$submitModByIDInputError ||
        (this._$submitModByIDInputError = this.$('.js-submitModByIDInputError'));
  }

  get $submitModByIDInputErrorText() {
    return this._$submitModByIDInputErrorText ||
        (this._$submitModByIDInputErrorText = this.$submitModByIDInputError.find('.js-errorText'));
  }

  render() {
    loadTemplate('modals/settings/store.html', (t) => {
      this.$el.html(t({
        originalMods: this.settings.get('storeModerators').length > 0,
        errors: {
          ...(this.profile.validationError || {}),
          ...(this.settings.validationError || {}),
        },
        ...this.profile.toJSON(),
        ...this.settings.toJSON(),
      }));

      // this.$('#moderationCurrency').select2();

      this.$profileFormFields = this.$('.js-profileField');
      this._$btnSave = null;
      this._$modListSelected = null;
      this._$modListByID = null;
      this._$modListAvailable = null;
      this._$browseMods = null;
      this._$submitModByIDInput = null;
      this._$submitModByID = null;
      this._$submitModByIDInputError = null;
      this._$submitModByIDInputErrorText = null;
    });

    return this;
  }
}

