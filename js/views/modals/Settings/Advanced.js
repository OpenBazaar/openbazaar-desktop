import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { openSimpleMessage } from '../SimpleMessage';

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
    };
  }

  resetSMTPFields() {
    this.settings.set('smtpSettings',
      this.settings.get('smtpSettings').defaults(), { validate: true });
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
    this.getCachedEl('.js-resyncProgress').removeClass('hide');
    this.getCachedEl('.js-resyncComplete').addClass('hide');

    this.resync = $.post(app.getServerUrl('wallet/resyncblockchain'))
      .always(() => {
        this.getCachedEl('.js-resync').removeClass('processing');
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.resyncError'),
          failReason);
      })
      .done(() => {
        // this takes several minutes, the user will probably navigate away before it's done
        this.getCachedEl('.js-resyncProgress').addClass('hide');
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

  remove() {
    if (this.resync) this.resync.abort();
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
        ...this.settings.toJSON(),
        ...this.localSettings.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]').
        not('[data-persistence-location="local"]');
      this.$localFields = this.$('[data-persistence-location="local"]');
    });

    return this;
  }
}
