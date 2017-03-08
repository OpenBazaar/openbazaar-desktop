import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import { getGuid } from '../../../utils';
import baseVw from '../../baseVw';
import Moderators from '../../../collections/Moderators';
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
      const fetch = this.modsSelected.fetch({ fetchList: this.currentMods });
      this.modFetches.push(fetch);
    }

    this.listenTo(this.modsSelected, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListSelected, { cardState: 'selected' });
    });

    this.listenTo(this.modsSelected, 'asyncError', (opts) => {
      this.modNotFound(opts.id, '', opts.error);
    });

    this.listenTo(this.modsByID, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListByID);
    });

    this.listenTo(this.modsByID, 'asyncError', (opts) => {
      this.modNotFound(opts.id, '', opts.error);
    });

    this.listenTo(this.modsAvailable, 'add', (model, collection) => {
      this.addModToList(model, collection, this.$modListAvailable);
    });

    this.listenTo(this.modsAvailable, 'asyncError', (opts) => {
      this.modNotFound(opts.id, '', opts.error);
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
      target.addClass('processing');
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
        newModView.cardState = opts.cardState || 'view';
        newModView.delegateEvents();
      }
      // if the view already exists and is in the DOM, this will move it
      docFrag.append(newModView.render().$el);
      target.prepend(docFrag);
      this.modViewCache.push(newModView);
    }

    // if all moderators have loaded, clear any processing class
    if (!collection.notFetchedYet.length && target) {
      target.removeClass('processing');
    }
    // if it takes a very long time to get the moderators, clear the processing class
    setTimeout(() => target && target.removeClass('processing'), 15000);
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

  modNotFound(guid, handle, error = '') {
    const title = app.polyglot.t('settings.storeTab.errors.modNotFoundTitle');
    const phrase = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });
    const msg = `${phrase} \n ${error}`;

    openSimpleMessage(title, msg);
  }

  loadModByID(guid, handle = '') {
    const addedError = app.polyglot.t('settings.storeTab.errors.modAlreadyAdded');
    const badModError = app.polyglot.t('settings.storeTab.errors.modNotFound',
        { guidOrHandle: handle || guid });

    this.$submitModByIDInputError.addClass('hide');

    if (this.currentMods.indexOf(guid) === -1) {
      const fetch = this.modsByID.fetch({ fetchList: [guid] })
          .done(() => {
            this.currentMods.push(guid);
            this.$submitModByIDInput.val('');
          })
          .fail(() => {
            if (this.isRemoved()) return;
            this.showModByIDError(badModError);
          })
          .always(() => {
            if (this.isRemoved()) return;
            this.$submitModByID.removeClass('processing');
          });
      this.modFetches.push(fetch);
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
            this.modsSelected.add(modToAdd);
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

  remove() {
    this.modFetches.forEach(fetch => fetch.abort());
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
      this._$browseMods = null;
      this._$submitModByIDInput = null;
      this._$submitModByID = null;
      this._$submitModByIDInputError = null;
      this._$submitModByIDInputErrorText = null;

      // if mods are already available, add them now
      this.modsSelected.each((mod) => {
        this.addModToList(mod, this.modsSelected, this.$modListSelected, { cardState: 'selected' });
      });
      this.modsByID.each((mod) => {
        this.addModToList(mod, this.modsByID, this.$modListByID, { cardState: 'view' });
      });
      this.modsAvailable.each((mod) => {
        this.addModToList(mod, this.modsAvailable, this.$modListAvailable, { cardState: 'view' });
      });
    });

    return this;
  }
}

