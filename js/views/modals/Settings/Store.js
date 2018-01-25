import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import { getGuid, isMultihash } from '../../../utils';
import baseVw from '../../baseVw';
//import Moderators from '../../../collections/Moderators_old';
import Moderators from '../../components/Moderators';
//import ModCard from '../../ModeratorCard';
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
    console.log(app.polyglot.t('settings.storeTab.errors.selectedModsTitle'))

    this.modsSelected = new Moderators({
      async: true,
      moderatorIDs: this.currentMods,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.selectedModsTitle'),
      cardState: 'selected',
      notSelected: 'deselected',
    });

    this.modsByID = new Moderators({
      async: false,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.modNotFoundTitle'),
      cardState: 'selected',
      notSelected: 'deselected',
    });

    this.modsAvailable = new Moderators({
      apiPath: 'moderators',
      async: true,
      method: 'GET',
      include: 'profile',
      excludeIDs: this.modsSelected,
      // excludeCollection: this.modsSelected,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.availableModsTitle'),
      cardState: 'selected',
      notSelected: 'deselected',
    });

    /*
    this.modFetches = [];
    this.modViewCache = [];

    if (this.currentMods.length) {
      // fetch the already selected moderators
      this.selectedModsInvalidList = [];
      this.selectedModsAsyncInvalidList = [];
      const fetch = this.modsSelected.fetch({ fetchList: this.currentMods });
      this.modFetches.push(fetch);
    }

    this.listenTo(this.modsSelected, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListSelectedInner, {
        cardState: 'selected',
        notSelected: 'deselected',
      });
    });

    this.listenTo(this.modsSelected, 'asyncError', (opts) => {
      this.showSelectedModsAsyncError(opts.id);
    });

    this.listenTo(this.modsSelected, 'doneLoading', () => {
      this.doneLoading(this.$modListSelected);
    });

    this.listenTo(this.modsSelected, 'invalidMod', (opts) => {
      // one of the current mods is no longer valid, remove it and show an error
      const data = { guid: opts.id };
      this.changeMod(data);
      this.showSelectedModsError(opts.id);
    });

    this.listenTo(this.modsByID, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListByIDInner, {
        cardState: 'unselected',
        notSelected: 'unselected',
      });
    });

    this.listenTo(this.modsByID, 'asyncError', (opts) => {
      this.modNotFound(opts.id);
    });

    this.listenTo(this.modsByID, 'doneLoading', () => {
      this.doneLoading(this.$modListByID);
    });

    this.listenTo(this.modsByID, 'invalidMod', (opts) => {
      this.showModByIDError(app.polyglot.t('settings.storeTab.errors.modIsInvalid',
          { guid: opts.id }));
    });

    this.listenTo(this.modsAvailable, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListAvailableInner, {
        cardState: 'unselected',
        notSelected: 'unselected',
      });
    });

    this.listenTo(this.modsAvailable, 'asyncError', (opts) => {
      this.modNotFound(opts.id);
    });

    this.listenTo(this.modsAvailable, 'doneLoading', () => {
      this.doneLoading(this.$modListAvailable);
    });
    */
  }

  events() {
    return {
      'click .js-browseMods': 'fetchAvailableModerators',
      'click .js-submitModByID': 'clickSubmitModByID',
      'click .js-save': 'save',
    };
  }

  /*
  fetchAvailableModerators() {
    this.$modListAvailable.addClass('processing');
    const fetch = this.modsAvailable.fetch()
      .fail((...args) => {
        if (this.isRemoved()) return;
        const title = app.polyglot.t('settings.storeTab.errors.availableModsFailed');
        const message = args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';
        openSimpleMessage(title, message);
      })
      .always(() => {
        if (this.isRemoved()) return;
        // remove the processing class after a long enough time. If it's still visible
        // there are probably no moderators coming.
        setTimeout(() => this.$modListAvailable.removeClass('processing'), 20000);
      });
    this.modFetches.push(fetch);
  }

  addModToList(model, collection, target, opts = {}) {
    let newModView;

    // if DOM is available, set DOM state
    if (target) {
      target.parent().toggleClass('hasMods', !!collection.length);
    }

    if (model) {
      const docFrag = $(document.createDocumentFragment());
      // check to see if view already exists
      const cachedView = _.find(this.modViewCache, (mod) => mod.model.id === model.id);
      // if view hasn't already been created, create it now
      if (!cachedView) {
        newModView = this.createChild(ModCard, {
          model,
          ...opts,
        });
        this.listenTo(newModView, 'changeModerator', (data) => this.changeMod(data));
      } else {
        newModView = cachedView;
        newModView.delegateEvents();
        // when cards are moved betwen lists, set their options to fit the target list
        newModView.cardState = opts.cardState || 'unselected';
        newModView.notSelected = opts.notSelected || 'unselected';
      }
      // if the view already exists and is in the DOM, this will move it
      docFrag.append(newModView.render().$el);
      target.append(docFrag);
      this.modViewCache.push(newModView);
    }
  }

  doneLoading(target) {
    // if all moderators have loaded, clear any processing class
    target.removeClass('processing');
  }
  */

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
    if (isMultihash(modID)) {
      this.loadModByID(modID);
      this.$submitModByID.removeClass('processing');
    } else {
      // assume id is a handle
      const handle = modID.charAt(0) === '0' ? modID.slice(1) : modID;
      getGuid(handle)
          .done((guid) => {
            this.loadModByID(guid);
          })
          .fail(() => {
            this.modNotFound(modID, handle);
          })
          .always(() => {
            this.$submitModByID.removeClass('processing');
          });
    }
  }

  modNotFoundInSelected(guid, handle) {
    const title = app.polyglot.t('settings.storeTab.errors.modNotFoundTitle');
    const msg = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });

    openSimpleMessage(title, msg);
  }

  modNotFound(guid, handle) {
    const title = app.polyglot.t('settings.storeTab.errors.modNotFoundTitle');
    const msg = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });

    openSimpleMessage(title, msg);
  }

  loadModByID(guid, handle = '') {
    const addedError = app.polyglot.t('settings.storeTab.errors.modAlreadyAdded');
    const badModError = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });

    this.$submitModByIDInputError.addClass('hide');

    if (this.currentMods.indexOf(guid) === -1) {
      this.$modListByID.addClass('processing');
      const fetch = this.modsByID.fetch({ fetchList: [guid] })
          .done(() => {
            this.$submitModByIDInput.val('');
          })
          .fail(() => {
            if (this.isRemoved()) return;
            this.showModByIDError(badModError);
            this.$modListByID.removeClass('processing');
          });
      this.modFetches.push(fetch);
    } else {
      this.showModByIDError(addedError);
    }
  }

  showModByIDError(msg) {
    this.$submitModByIDInputError.removeClass('hide');
    this.$submitModByIDInputErrorText.text(msg);
    this.$submitModByID.removeClass('processing');
  }

  showSelectedModsAsyncError(id) {
    this.selectedModsAsyncInvalidList.push(id);
    const msg = app.polyglot.t('settings.storeTab.errors.modsAreInvalidAsync',
        { guids: this.selectedModsAsyncInvalidList.join(', ') });
    this.$selectedModsAsyncError.removeClass('hide');
    this.$selectedModsAsyncErrorText.text(msg);
  }

  showSelectedModsError(id) {
    this.selectedModsInvalidList.push(id);
    const msg = app.polyglot.t('settings.storeTab.errors.modsAreInvalid',
        { guids: this.selectedModsInvalidList.join(', ') });
    this.$selectedModsError.removeClass('hide');
    this.$selectedModsErrorText.text(msg);
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
    this.profile.set(profileFormData, { validate: true });
    this.settings.set(settingsFormData);
    this.settings.set(settingsFormData, { validate: true });

    if (!this.profile.validationError && !this.settings.validationError) {
      this.$btnSave.addClass('processing');

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
          // remove models that aren't selected any more
          const oldIDs = this.modsSelected.pluck('id');
          const removedIDs = _.without(oldIDs, this.currentMods);
          const addedIDs = _.without(this.currentMods, oldIDs);
          const removedModels = [];

          // set aside removed models
          removedIDs.forEach((modelID) => {
            const modToAdd = this.modsSelected.get(modelID);
            removedModels.push(modToAdd);
          });

          // remove moderators by id from the selected moderators
          this.modsSelected.remove(removedIDs);

          // add removed moderators to available list now that they won't be excluded
          this.modsAvailable.add(removedModels);

          // add the models from the other collections to the selected moderators
          addedIDs.forEach((modelID) => {
            const modToAdd = this.modsByID.get(modelID) || this.modsAvailable.get(modelID);
            if (modToAdd) this.modsSelected.add(modToAdd);
          });

          // remove added models from other collections
          this.modsByID.remove(addedIDs);
          this.modsAvailable.remove(addedIDs);
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
        errors: {
          ...(this.profile.validationError || {}),
          ...(this.settings.validationError || {}),
        },
        ...this.profile.toJSON(),
        ...this.settings.toJSON(),
      }));

      this.modsSelected.delegateEvents();
      this.$('.js-modListSelected').append(this.modsSelected.render().el);
      if (!this.modsSelected.fetch ||
        (this.modsSelected.fetch && this.modsSelected.fetch.state() !== 'pending')) {
        this.modsSelected.getModeratorsByID();
      }
    });

    return this;
  }
}

