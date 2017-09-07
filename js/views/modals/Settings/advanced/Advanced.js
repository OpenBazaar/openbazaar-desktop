import { clipboard } from 'electron';
import $ from 'jquery';
import app from '../../../../app';
import { openSimpleMessage } from '../../SimpleMessage';
import Dialog from '../../../modals/Dialog';
import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';
import WalletSeed from './WalletSeed';
import SmtpSettings from './SmtpSettings';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options,
    });

    this.settings = app.settings.clone();

    // Sync our clone with any changes made to the global settings model.
    this.listenTo(app.settings, 'someChange',
      (md, opts) => this.settings.set(opts.setAttrs));

    // Sync the global settings model with any changes we save via our clone.
    this.listenTo(this.settings, 'sync',
      (md, resp, opts) => app.settings.set(this.settings.toJSON(opts.attrs)));

    this.localSettings = app.localSettings.clone();

    // Sync our clone with any changes made to the global local settings model.
    this.listenTo(app.localSettings, 'someChange',
      (md, opts) => this.localSettings.set(opts.setAttrs));

    // Sync the global local settings model with any changes we save via our clone.
    this.listenTo(this.localSettings, 'sync',
      (md, resp, opts) => app.localSettings.set(this.localSettings.toJSON(opts.attrs)));
  }

  get events() {
    return {
      'click .js-save': 'save',
      'click .js-showConnectionManagement': 'showConnectionManagement',
      'click .js-resync': 'clickResync',
      'click .js-purge': 'clickPurge',
      'click .js-blockData': 'clickBlockData',
    };
  }

  onClickShowSeed() {
    if (this.walletSeedFetch && this.walletSeedFetch.state() === 'pending') {
      return this.walletSeedFetch;
    }

    if (this.walletSeed) this.walletSeed.setState({ isFetching: true });

    this.walletSeedFetch = $.get(app.getServerUrl('wallet/mnemonic')).done((data) => {
      this.mnemonic = data.mnemonic;
      if (this.walletSeed) {
        this.walletSeed.setState({ seed: data.mnemonic });
      }
    }).always(() => {
      if (this.walletSeed) this.walletSeed.setState({ isFetching: false });
    })
    .fail(xhr => {
      openSimpleMessage(
        app.polyglot.t('settings.advancedTab.server.unableToFetchSeedTitle'),
        xhr.responseJSON && xhr.responseJSON.reason || ''
      );
    });

    return this.walletSeedFetch;
  }

  showConnectionManagement() {
    app.connectionManagmentModal.open();
  }

  getFormData(subset = this.$formFields) {
    return super.getFormData(subset);
  }

  clickResync() {
    this.resynchronize();
  }

  resynchronize() {
    this.getCachedEl('.js-resync').addClass('processing');
    this.getCachedEl('.js-resyncComplete').addClass('hide');

    this.resync = $.post(app.getServerUrl('wallet/resyncblockchain'))
      .always(() => {
        this.getCachedEl('.js-resync').removeClass('processing');
      })
      .fail((xhr) => {
        if (xhr.statusText === 'abort') return;
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.resyncError'),
          failReason);
      })
      .done(() => {
        this.getCachedEl('.js-resyncComplete').removeClass('hide');
      });
  }

  clickPurge() {
    this.purgeCache();
  }

  /**
   * Call to the server to remove cached files that are being shared on IPFS.
   * This call should not be aborted when the view is removed, it's critical the user is informed if
   * the call fails, even if they have navigated away from the view.
   */
  purgeCache() {
    this.getCachedEl('.js-purge').addClass('processing');
    this.getCachedEl('.js-purgeComplete').addClass('hide');

    this.purge = $.post(app.getServerUrl('ob/purgecache'))
      .always(() => {
        this.getCachedEl('.js-purge').removeClass('processing');
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.purgeError'),
          failReason);
      })
      .done(() => {
        this.getCachedEl('.js-purgeComplete').removeClass('hide');
      });
  }

  clickBlockData() {
    this.showBlockData();
  }

  /**
   * Calls the server to retrieve and display information about the block the transactions are on
   */
  showBlockData() {
    this.getCachedEl('.js-blockData').addClass('processing');

    this.blockData = $.get(app.getServerUrl('wallet/status'))
      .always(() => {
        this.getCachedEl('.js-blockData').removeClass('processing');
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.blockDataError'),
          failReason);
      })
      .done((data) => {
        const buttons = [{
          text: app.polyglot.t('settings.advancedTab.server.blockDataCopy'),
          fragment: 'copyBlockData',
        }];
        const message = `<p><b>Best Hash:</b><br> ${data.bestHash}</p><p><b>Height:</b><br>` +
          `${data.height}</p>`;
        const blockDataDialog = new Dialog({
          title: app.polyglot.t('settings.advancedTab.server.blockDataTitle'),
          message,
          buttons,
          showCloseButton: true,
          removeOnClose: true,
        }).render().open();
        this.listenTo(blockDataDialog, 'click-copyBlockData', () => {
          clipboard.writeText(`Best Hash: ${data.bestHash} Height: ${data.height}`);
        });
      });
  }


  save() {
    this.localSettings.set(this.getFormData(this.$localFields));
    this.localSettings.set({}, { validate: true });

    this.smtpSettings.setModelData();
    const serverFormData = {
      ...this.getFormData(),
      smtpSettings: this.smtpSettings.model.toJSON(),
    };
    this.settings.set(serverFormData, { validate: true });

    if (!this.localSettings.validationError && !this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('settings.advancedTab.statusSaving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      // let's save and monitor both save processes
      const localSave = this.localSettings.save();
      const serverSave = this.settings.save(serverFormData, {
        attrs: serverFormData,
        type: 'PATCH',
      });

      $.when(localSave, serverSave)
        .done(() => {
          // both succeeded!
          statusMessage.update({
            msg: app.polyglot.t('settings.advancedTab.statusSaveComplete'),
            type: 'confirmed',
          });
        })
        .fail((...args) => {
          // One has failed, the other may have also failed or may
          // fail or may succeed. It doesn't matter, for our purposed one
          // failure is enough for us to consider the "save" to have failed
          const errMsg = args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';

          openSimpleMessage(app.polyglot.t('settings.advancedTab.saveErrorAlertTitle'), errMsg);

          statusMessage.update({
            msg: app.polyglot.t('settings.advancedTab.statusSaveFailed'),
            type: 'warning',
          });
        })
        .always(() => {
          this.getCachedEl('.js-save').removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
    }

    this.render();

    if (!this.localSettings.validationError && !this.settings.validationError) {
      this.getCachedEl('.js-save').addClass('processing');
    } else {
      const $firstErr = this.$('.errorList:first');

      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        const models = [];
        if (this.localSettings.validationError) models.push(this.localSettings);
        if (this.settings.validationError) models.push(this.settings);
        this.trigger('unrecognizedModelError', this, models);
      }
    }
  }

  get $smtpSettingsFields() {
    const selector = `.js-smtpSettingsForm select[name], .js-smtpSettingsForm input[name],
      .js-smtpSettingsForm textarea[name]:not([class*="trumbowyg"]),
      .js-smtpSettingsForm div[contenteditable][name]`;

    return this.getCachedEl(selector);
  }

  remove() {
    if (this.resync) this.resync.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/settings/advanced/advanced.html', (t) => {
      this.$el.html(t({
        errors: {
          ...(this.settings.validationError || {}),
          ...(this.localSettings.validationError || {}),
        },
        isSyncing: this.resync && this.resync.state() === 'pending',
        isPurging: this.purge && this.purge.state() === 'pending',
        isGettingBlockData: this.blockData && this.blockData.state() === 'pending',
        ...this.settings.toJSON(),
        ...this.localSettings.toJSON(),
      }));

      const formFieldsSelector = `
        .contentBox:not(.js-contentBoxEmailIntegration) select[name],
        .contentBox:not(.js-contentBoxEmailIntegration) input[name],
        .contentBox:not(.js-contentBoxEmailIntegration) textarea[name]
      `;
      this.$formFields = this.$(formFieldsSelector)
        .not('[data-persistence-location="local"]');
      this.$localFields = this.$('[data-persistence-location="local"]');

      if (this.walletSeed) this.walletSeed.remove();
      this.walletSeed = this.createChild(WalletSeed, {
        initialState: {
          seed: this.mnemonic || '',
          isFetching: this.walletSeedFetch && this.walletSeedFetch.state() === 'pending',
        },
      });
      this.listenTo(this.walletSeed, 'clickShowSeed', this.onClickShowSeed);
      this.getCachedEl('.js-walletSeedContainer').append(this.walletSeed.render().el);

      if (this.smtpSettings) this.smtpSettings.remove();
      this.smtpSettings = this.createChild(SmtpSettings, {
        model: this.settings.get('smtpSettings'),
      });
      this.getCachedEl('.js-smtpSettingsContainer').html(this.smtpSettings.render().el);
    });

    return this;
  }
}
