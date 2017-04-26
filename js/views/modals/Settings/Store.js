import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import { getGuid, isMultihash } from '../../../utils';
import baseVw from '../../baseVw';
import Moderators from '../../../collections/Moderators';
import ModCard from '../../ModeratorCard';
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
      apiPath: 'fetchprofiles',
      async: true,
    });

    this.modsByID = new Moderators(null, {
      apiPath: 'fetchprofiles',
      async: true,
    });

    this.modsAvailable = new Moderators(null, {
      async: true,
      include: 'profile',
      excludeCollection: this.modsSelected,
    });

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
      this.addModToList(model, collection, this.$modListSelected, {
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
      this.addModToList(model, collection, this.$modListByID, {
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
      this.addModToList(model, collection, this.$modListAvailable, {
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
        setTimeout(() => this.$modListAvailable.removeClass('processing'), 15000);
      });
    this.modFetches.push(fetch);
  }

  addModToList(model, collection, target, opts = {}) {
    let newModView;

    // if DOM is available, set DOM state
    if (target) {
      target.toggleClass('hasMods', !!collection.length);
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
      target.prepend(docFrag);
      this.modViewCache.push(newModView);
    }
  }

  doneLoading(target) {
    // if all moderators have loaded, clear any processing class
    target.removeClass('processing');
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
    }
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

  get $selectedModsError() {
    return this._$selectedModsError ||
        (this._$selectedModsError = this.$('.js-selectedModsError'));
  }

  get $selectedModsErrorText() {
    return this._$selectedModsErrorText ||
        (this._$selectedModsErrorText = this.$selectedModsError.find('.js-errorText'));
  }

  get $selectedModsAsyncError() {
    return this._$selectedModsAsyncError ||
        (this._$selectedModsAsyncError = this.$('.js-selectedModsAsyncError'));
  }

  get $selectedModsAsyncErrorText() {
    return this._$selectedModsAsyncErrorText ||
        (this._$selectedModsAsyncErrorText = this.$selectedModsAsyncError.find('.js-errorText'));
  }

  remove() {
    this.modFetches.forEach(fetch => fetch.abort());
    this.modsSelected.destroy();
    this.modsByID.destroy();
    this.modsAvailable.destroy();
    super.remove();
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

      this.$profileFormFields = this.$('.js-profileField');
      this._$btnSave = null;
      this._$modListSelected = null;
      this._$modListByID = null;
      this._$modListAvailable = null;
      this._$submitModByIDInput = null;
      this._$submitModByID = null;
      this._$submitModByIDInputError = null;
      this._$submitModByIDInputErrorText = null;
      this._$selectedModsError = null;
      this._$selectedModsErrorText = null;
      this._$selectedModsAsyncError = null;
      this._$selectedModsAsyncErrorText = null;

      // if mods are already available, add them now
      this.modsSelected.each((mod) => {
        this.addModToList(mod, this.modsSelected, this.$modListSelected, {
          cardState: 'selected',
          notSelected: 'deselected',
        });
      });
      if (this.modsSelected.notFetchedYet.length) this.$modListSelected.addClass('processing');

      this.modsByID.each((mod) => {
        this.addModToList(mod, this.modsByID, this.$modListByID, {
          cardState: 'unselected',
          notSelected: 'unselected',
        });
      });
      if (this.modsByID.notFetchedYet.length) this.$modListByID.addClass('processing');

      this.modsAvailable.each((mod) => {
        this.addModToList(mod, this.modsAvailable, this.$modListAvailable, {
          cardState: 'unselected',
          notSelected: 'unselected',
        });
      });
      if (this.modsAvailable.notFetchedYet.length) this.$modListAvailable.addClass('processing');
    });

    return this;
  }
}

