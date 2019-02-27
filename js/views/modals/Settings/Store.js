import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import { isMultihash } from '../../../utils';
import { bulkCoinUpdate } from '../../../utils/bulkCoinUpdate';
import { supportedWalletCurs } from '../../../data/walletCurrencies';
import Moderators from '../../components/moderators/Moderators';
import BulkCoinUpdateBtn from './BulkCoinUpdateBtn';
import CurrencySelector from '../../components/CryptoCurSelector';
import { openSimpleMessage } from '../SimpleMessage';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      className: 'settingsStore',
      ...options,
    };
    super(opts);
    this.options = opts;

    this.profile = app.profile.clone();

    // Sync our clone with any changes made to the global profile.
    this.listenTo(app.profile, 'someChange',
      (md, pOpts) => this.profile.set(pOpts.setAttrs));

    // Sync the global profile with any changes we save via our clone.
    this.listenTo(this.profile, 'sync',
      (md, resp, pOpts) => app.profile.set(this.profile.toJSON(pOpts.attrs)));

    this.settings = app.settings.clone();

    // Sync our clone with any changes made to the global settings model.
    this.listenTo(app.settings, 'someChange',
      (md, sOpts) => this.settings.set(sOpts.setAttrs));

    // Sync the global settings model with any changes we save via our clone.
    this.listenTo(this.settings, 'sync',
      (md, resp, sOpts) => app.settings.set(this.settings.toJSON(sOpts.attrs)));

    const preferredCurs = [...new Set(app.profile.get('currencies'))];

    this.currencySelector = this.createChild(CurrencySelector, {
      initialState: {
        currencies: supportedWalletCurs(),
        activeCurs: preferredCurs,
        sort: true,
      },
    });

    this.listenTo(this.currencySelector, 'currencyClicked', sOpts => {
      this.handleCurrencyClicked(sOpts);
    });

    this.currentMods = this.settings.get('storeModerators');
    this._showVerifiedOnly = true;

    this.modsSelected = new Moderators({
      cardState: 'selected',
      controlsOnInvalid: true,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.selectedModsTitle'),
      notSelected: 'deselected',
      showInvalid: true,
      showSpinner: false,
      initialState: {
        preferredCurs,
      },
    });

    this.modsByID = new Moderators({
      async: false,
      excludeIDs: this.currentMods,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.modNotFoundTitle'),
      showInvalid: true,
      showSpinner: false,
      wrapperClasses: 'noMin',
      initialState: {
        preferredCurs,
      },
    });

    this.listenTo(this.modsByID, 'noModsFound', (mOpts) => this.noModsByIDFound(mOpts.guids));

    this.modsAvailable = new Moderators({
      apiPath: 'moderators',
      excludeIDs: this.currentMods,
      fetchErrorTitle: app.polyglot.t('settings.storeTab.errors.availableModsTitle'),
      showLoadBtn: true,
      initialState: {
        preferredCurs,
        showVerifiedOnly: true,
      },
    });

    const modsToCheckOnVerifiedUpdate = [
      {
        view: this.modsSelected,
        hasVerifiedMods: app.verifiedMods.matched(this.modsSelected.allIDs).length > 0,
      },
      {
        view: this.modsByID,
        hasVerifiedMods: app.verifiedMods.matched(this.modsByID.allIDs).length > 0,
      },
      {
        view: this.modsAvailable,
        hasVerifiedMods: app.verifiedMods.matched(this.modsAvailable.allIDs).length > 0,
      },
    ];

    this.listenTo(app.verifiedMods, 'update', () => {
      modsToCheckOnVerifiedUpdate.forEach(obj => {
        const nowSelected = app.verifiedMods.matched(obj.view.allIDs).length > 0;
        if (nowSelected !== obj.hasVerifiedMods) {
          obj.hasVerifiedMods = nowSelected;
          obj.view.render();
        }
      });
    });

    this.bulkCoinUpdateBtn = new BulkCoinUpdateBtn();
    this.listenTo(this.bulkCoinUpdateBtn, 'bulkCoinUpdateConfirm', () => {
      const newCoins = this.currencySelector.getState().activeCurs;
      if (newCoins.length) {
        bulkCoinUpdate(this.currencySelector.getState().activeCurs);
        this.bulkCoinUpdateBtn.setState({
          isBulkCoinUpdating: true,
          showConfirmTooltip: false,
          error: '',
        });
      } else {
        this.bulkCoinUpdateBtn.setState({
          isBulkCoinUpdating: false,
          showConfirmTooltip: false,
          error: 'NoCoinsError',
        });
      }
    });
  }

  events() {
    return {
      'click .js-browseMods': 'fetchAvailableModerators',
      'click .js-submitModByID': 'clickSubmitModByID',
      'click .js-save': 'save',
      'click .js-storeVerifiedOnly': 'onClickVerifiedOnly',
    };
  }

  noModsByIDFound(guids) {
    const modsNotFound = app.polyglot.t('settings.storeTab.errors.modsNotFound',
      { guids, smart_count: guids.length });
    this.showModByIDError(modsNotFound);
    if (this.modsByID.modCount === 0) {
      this.getCachedEl('.js-modListByID').addClass('hide');
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

  handleCurrencyClicked(opts) {
    const preferredCurs = opts.activeCurs;
    this.modsSelected.setState({ preferredCurs });
    this.modsByID.setState({ preferredCurs });
    this.modsAvailable.setState({ preferredCurs });
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
    this.showVerifiedOnly = $(e.target).prop('checked');
  }

  getProfileFormData(subset = this.$profileFormFields) {
    return super.getFormData(subset);
  }

  getSettingsData() {
    let selected = app.settings.get('storeModerators');
    // The mods may not have loaded in the interface yet. Subtract only explicitly de-selected ones.
    selected = _.without(selected, ...this.modsSelected.unselectedIDs);
    const byID = this.modsByID.selectedIDs;
    const available = this.modsAvailable.selectedIDs;
    return { storeModerators: [...new Set([...selected, ...byID, ...available])] };
  }

  save() {
    // this view saves to two different models
    const profileFormData = this.getProfileFormData();
    profileFormData.currencies = this.currencySelector.getState().activeCurs;
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
          const unSel = this.modsSelected.unselectedIDs;
          const remSel = this.modsSelected.removeModeratorsByID(unSel);
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
            showSpinner: false,
          });

          // If any of the mods moved to the available collect are unverified, show them
          if (app.verifiedMods.matched(unSel).length !== unSel.length) {
            // Don't render, the render is in the always handler
            this._showVerifiedOnly = false;
          }
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

  set showVerifiedOnly(bool) {
    this._showVerifiedOnly = bool;
    this.modsAvailable.setState({ showVerifiedOnly: bool });
  }

  render() {
    super.render();

    loadTemplate('modals/settings/store.html', (t) => {
      this.$el.html(t({
        modsAvailable: this.modsAvailable.allIDs,
        showVerifiedOnly: this._showVerifiedOnly,
        errors: {
          ...(this.profile.validationError || {}),
          ...(this.settings.validationError || {}),
        },
        ...this.profile.toJSON(),
        ...this.settings.toJSON(),
      }));

      this.currencySelector.delegateEvents();
      this.$('.js-currencySelector').append(this.currencySelector.render().el);

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

      this.bulkCoinUpdateBtn.delegateEvents();
      this.getCachedEl('.js-bulkCoinUpdateBtn').append(this.bulkCoinUpdateBtn.render().el);
    });

    return this;
  }
}

