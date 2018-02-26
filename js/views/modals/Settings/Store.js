import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import { isMultihash } from '../../../utils';
import baseVw from '../../baseVw';
import Moderators from '../../components/Moderators';
import { openSimpleMessage } from '../SimpleMessage';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsStore',
      ...options,
    });

    this.profile = app.profile.clone();

    // Sync our clone with any changes made to the global profile.
    this.listenTo(app.profile, 'someChange',
      (md, opts) => this.profile.set(opts.setAttrs));

    // Sync the global profile with any changes we save via our clone.
    this.listenTo(this.profile, 'sync',
      (md, resp, opts) => app.profile.set(this.profile.toJSON(opts.attrs)));

    this.settings = app.settings.clone();

    // Sync our clone with any changes made to the global settings model.
    this.listenTo(app.settings, 'someChange',
      (md, opts) => this.settings.set(opts.setAttrs));

    // Sync the global settings model with any changes we save via our clone.
    this.listenTo(this.settings, 'sync',
      (md, resp, opts) => app.settings.set(this.settings.toJSON(opts.attrs)));

    this.currentMods = this.settings.get('storeModerators');

    this.modsSelected = new Moderators({
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.selectedModsTitle'),
      cardState: 'selected',
      notSelected: 'deselected',
      showInvalid: true,
      controlsOnInvalid: true,
      showSpinner: false,
    });

    this.modsByID = new Moderators({
      async: false,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.modNotFoundTitle'),
      excludeIDs: this.currentMods,
      showInvalid: true,
      wrapperClasses: 'noMin',
      showSpinner: false,
    });

    this.listenTo(this.modsByID, 'noModsFound', (opts) => this.noModsFound(opts.guids));

    this.modsAvailable = new Moderators({
      apiPath: 'moderators',
      excludeIDs: this.currentMods,
      showVerifiedOnly: true,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.availableModsTitle'),
      showLoadBtn: true,
    });
  }

  events() {
    return {
      'click .js-browseMods': 'fetchAvailableModerators',
      'click .js-submitModByID': 'clickSubmitModByID',
      'click .js-save': 'save',
      'click #verifiedOnly': 'onClickVerifiedOnly',
    };
  }

  noModsFound(guids) {
    const modsNotFound = app.polyglot.t('settings.storeTab.errors.modsNotFound',
      { guids, smart_count: guids.length });
    this.showModByIDError(modsNotFound);
    if (this.modsByID.modCount === 0) {
      this.getCachedEl('.js-modListAvailable').addClass('hide');
    }
  }

  fetchAvailableModerators() {
    // get the verified mods via POST
    this.modsAvailable.getModeratorsByID({
      moderatorIDs: app.verifiedMods.pluck('peerID'),
      useCache: true,
      method: 'POST',
      apiPath: 'fetchprofiles',
    });
    // get random mods via GET
    this.modsAvailable.getModeratorsByID();
    this.getCachedEl('.js-modListAvailable').removeClass('hide');
    this.getCachedEl('.js-noModsAdded').addClass('hide');
  }

  showModByIDError(msg) {
    this.getCachedEl('.js-submitModByIDInputError').removeClass('hide');
    this.getCachedEl('.js-submitModByIDInputErrorText').text(msg);
  }

  clickSubmitModByID() {
    let modID = this.getCachedEl('.js-submitModByIDInput').val();

    this.getCachedEl('.js-submitModByIDInputError').addClass('hide');

    if (modID) {
      // trim unwanted copy and paste characters
      modID = modID.replace('ob://', '');
      modID = modID.split('/')[0];
      modID = modID.trim();

      if (isMultihash(modID)) {
        if (!this.currentMods.includes(modID)) {
          if (modID !== app.profile.id) {
            this.modsByID.getModeratorsByID({ moderatorIDs: [modID] });
            this.getCachedEl('.js-modListByID').removeClass('hide');
          } else {
            const ownGUID = app.polyglot.t('settings.storeTab.errors.ownGUID', { guid: modID });
            this.showModByIDError(ownGUID);
          }
        } else {
          const dupeGUID = app.polyglot.t('settings.storeTab.errors.dupeGUID', { guid: modID });
          this.showModByIDError(dupeGUID);
        }
      } else {
        const notGUID = app.polyglot.t('settings.storeTab.errors.notGUID', { guid: modID });
        this.showModByIDError(notGUID);
      }
    } else {
      const blankError = app.polyglot.t('settings.storeTab.errors.modIsBlank');
      this.showModByIDError(blankError);
    }
  }

  onClickVerifiedOnly(e) {
    this.modsAvailable.togVerifiedShown($(e.target).prop('checked'));
  }

  getProfileFormData(subset = this.$profileFormFields) {
    return super.getFormData(subset);
  }

  getSettingsData() {
    const selected = this.modsSelected.selectedIDs;
    const byID = this.modsByID.selectedIDs;
    const available = this.modsAvailable.selectedIDs;
    return { storeModerators: [...new Set([...selected, ...byID, ...available])] };
  }

  save() {
    // this view saves to two different models
    const profileFormData = this.getProfileFormData();
    const settingsFormData = this.getSettingsData();

    this.profile.set(profileFormData);
    this.profile.set(profileFormData, { validate: true });
    this.settings.set(settingsFormData);
    this.settings.set(settingsFormData, { validate: true });

    if (!this.profile.validationError && !this.settings.validationError) {
      this.getCachedEl('.js-save').addClass('processing');

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

          // move the changed moderators
          this.currentMods = this.settings.get('storeModerators');
          const remSel = this.modsSelected.removeModeratorsByID(this.modsSelected.unselectedIDs);
          const remByID = this.modsByID.removeModeratorsByID(this.modsByID.selectedIDs);
          const remAvail = this.modsAvailable.removeModeratorsByID(this.modsAvailable.selectedIDs);

          this.modsByID.excludeIDs = this.currentMods;
          this.modsByID.moderatorsStatus.setState({
            hidden: true,
          });

          this.modsSelected.moderatorsCol.add([...remByID, ...remAvail]);
          this.modsSelected.moderatorsStatus.setState({
            hidden: true,
          });

          this.modsAvailable.excludeIDs = this.currentMods;
          this.modsAvailable.moderatorsCol.add(remSel);
          this.modsAvailable.moderatorsStatus.setState({
            hidden: false,
            total: this.modsAvailable.modCount,
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
          this.getCachedEl('.js-save').removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
          this.render();
        });
    } else {
      const $firstErr = this.$('.errorList:first:not(.hide)');

      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        const models = [];
        if (this.profile.validationError) models.push(this.profile);
        if (this.settings.validationError) models.push(this.settings);
        this.trigger('unrecognizedModelError', this, models);
      }
    }
  }

  render() {
    super.render();

    loadTemplate('modals/settings/store.html', (t) => {
      this.$el.html(t({
        modsAvailable: this.modsAvailable.allIDs,
        errors: {
          ...(this.profile.validationError || {}),
          ...(this.settings.validationError || {}),
        },
        ...this.profile.toJSON(),
        ...this.settings.toJSON(),
      }));

      this.modsSelected.delegateEvents();
      this.$('.js-modListSelected').append(this.modsSelected.render().el);
      if (!this.modsSelected.modFetches.length) {
        this.modsSelected.getModeratorsByID({ moderatorIDs: this.currentMods });
      }

      this.modsByID.delegateEvents();
      this.getCachedEl('.js-modListByID')
        .append(this.modsByID.render().el)
        .toggleClass('hide', !this.modsByID.allIDs.length);

      this.modsAvailable.delegateEvents();
      this.getCachedEl('.js-modListAvailable')
        .append(this.modsAvailable.render().el)
        .toggleClass('hide', !this.modsAvailable.allIDs.length);
    });

    return this;
  }
}

