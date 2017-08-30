import $ from 'jquery';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import Dialog from '../../modals/Dialog';
import { clipboard } from 'electron';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import WalletSeed from './WalletSeed';
import TestSmtpStatus from './TestSmtpStatus';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options,
    });

    this.settings = app.settings.clone();
    this.localSettings = app.localSettings.clone();

    this.listenTo(this.localSettings, 'sync',
      () => app.localSettings.set(this.localSettings.toJSON()));

    this.listenTo(this.settings, 'sync', (md, resp, syncOpts) => {
      // Since different tabs are working off different parts of
      // the settings model, to not overwrite each other, we'll only
      // update fields that our tab has changed.
      app.settings.set(syncOpts.attrs);
    });
  }

  get events() {
    return {
      'click .js-smtpContainer input[type="reset"]': 'resetSMTPFields',
      'click .js-save': 'save',
      'click .js-showConnectionManagement': 'showConnectionManagement',
      'click .js-resync': 'clickResync',
      'click .js-purge': 'clickPurge',
      'click .js-blockData': 'clickBlockData',
      'change [name="smtpSettings.notifications"]': 'onChangeShowSmtpNotifications',
      'click .js-testSMTPSettings': 'onClickTestSMTPSettings',
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

  onChangeShowSmtpNotifications() {
    const formData = this.getFormData(this.$smtpSettingsFields);
    this.settings.set(formData);
    this.render();
  }

  onClickTestSMTPSettings() {
    if (this.testSmtpPost) this.testSmtpPost.abort();
    if (this.testSmtpStatus) {
      this.testSmtpStatus.setState({
        isFetching: true,
        msg: '',
      });
    }

    const data = this.getFormData(this.$smtpSettingsFields).smtpSettings;

    this.testSmtpPost = $.post({
      url: app.getServerUrl('ob/testemailnotifications'),
      data: JSON.stringify(data || {}),
      dataType: 'json',
      contentType: 'application/json',
    }).done(() => {
      this.testSmtpStatus.setState({
        isFetching: false,
        success: true,
        msg: app.polyglot.t('settings.advancedTab.smtp.testSmtpSuccess'),
      });
    }).fail(xhr => {
      if (xhr.statusText === 'abort') return;
      const err = xhr.responseJSON && xhr.responseJSON.reason || '';
      const msg = err ?
        app.polyglot.t('settings.advancedTab.smtp.testSmtpFailWithError', { err }) :
        app.polyglot.t('settings.advancedTab.smtp.testSmtpFail');

      this.testSmtpStatus.setState({
        isFetching: false,
        success: false,
        msg,
      });
    });
  }

  resetSMTPFields() {
    this.settings.set('smtpSettings',
      this.settings.get('smtpSettings').defaults(), { validate: true });
    if (this.testSmtpPost) this.testSmtpPost.abort();
    if (this.testSmtpStatus) {
      this.testSmtpStatus.setState({
        isFetching: false,
        msg: '',
      });
    }
    this.render();
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

    const serverFormData = this.getFormData();
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
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  get $smtpSettingsFields() {
    const selector = `.js-smtpSettingsForm select[name], .js-smtpSettingsForm input[name],
      .js-smtpSettingsForm textarea[name]:not([class*="trumbowyg"]),
      .js-smtpSettingsForm div[contenteditable][name]`;

    return this.getCachedEl(selector);
  }

  remove() {
    if (this.resync) this.resync.abort();
    if (this.testSmtpPost) this.testSmtpPost.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/settings/advanced.html', (t) => {
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

      this.$formFields = this.$('select[name], input[name], textarea[name]').
        not('[data-persistence-location="local"]');
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

      const testSmtpStatusInitialState = {
        ...(this.testSmtpStatus && this.testSmtpStatus.getState() || {}),
      };

      if (this.testSmtpStatus) this.testSmtpStatus.remove();
      this.testSmtpStatus = this.createChild(TestSmtpStatus, {
        initialState: {
          ...testSmtpStatusInitialState,
          isFetching: this.testSmtpPost && this.testSmtpPost.state() === 'pending',
        },
      });
      this.getCachedEl('.js-testSmtpStatusContainer').html(this.testSmtpStatus.render().el);
    });

    return this;
  }
}
