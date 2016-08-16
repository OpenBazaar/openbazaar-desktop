import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import SimpleMessage from '../SimpleMessage';
import Dialog from '../Dialog';
import BaseModal from '../BaseModal';
import SettingsGeneral from './SettingsGeneral';
import SettingsPage from './SettingsPage';
import SettingsAddresses from './SettingsAddresses';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP border clrBr',
      removeOnRoute: false,
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      SettingsGeneral,
      SettingsPage,
      SettingsAddresses,
    };

    this.listenTo(app.router, 'will-route', () => {
      this.close(true);
      this.remove();
    });
  }

  className() {
    return `${super.className()} settings`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      'click .js-save': 'saveClick',
      ...super.events(),
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');

    this.selectTab(targ);
  }

  selectTab(targ) {
    const tabViewName = targ.data('tab');
    let tabView = this.tabViewCache[tabViewName];

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        tabView = this.createChild(this.tabViews[tabViewName]);
        this.tabViewCache[tabViewName] = tabView;
        tabView.render();
      }

      if (tabView instanceof SettingsAddresses) {
        this.$save.text(app.polyglot.t('settings.btnAddAddress'));
      } else {
        this.$save.text(app.polyglot.t('settings.btnSave'));
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  saveClick() {
    this.save();
  }

  save() {
    let statusMsg;
    let clientValidationSuccess = false;

    this.$save.addClass('loading');
    this.saving = true;
    this.$saveStatus.text('');

    // Tab views should implement save to return a promise. On a server error, please
    // include any error message when rejecting. Please send a progress event when
    // client validation succeeds (deferred.notify()).
    this.currentTabView.save()
      .progress(() => {
        clientValidationSuccess = true;

        statusMsg = app.statusBar.pushMessage({
          msg: app.polyglot.t('settings.statusSaving'),
          duration: 9999999999999999,
        });
      })
      .always(() => {
        this.saving = false;
        this.$save.removeClass('loading');

        if (statusMsg) {
          setTimeout(() => {
            statusMsg.remove();
          }, 3000);
        }
      })
      .fail((errorMsg = '') => {
        const $firstErr = this.currentTabView.$('.errorList:first');

        if (statusMsg) {
          statusMsg.update({
            msg: app.polyglot.t('settings.statusSaveFailed'),
            type: 'warning',
          });
        }

        // sroll to first error
        if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();

        // on server errors, we'll display a modal message
        if (clientValidationSuccess) {
          new SimpleMessage({
            title: app.polyglot.t('settings.errors.saveError'),
            message: errorMsg,
          })
          .render()
          .open();
        }
      })
      .done(() => {
        if (this.confirmNavAwayDialog && this.confirmNavAwayDialog.isOpen()) {
          this.$saveStatus.text(app.polyglot.t('settings.statusSafeToClose'));
        }

        statusMsg.update(app.polyglot.t('settings.statusSaveComplete'));
      });
  }

  close(skipWarning) {
    if (!skipWarning && this.saving) {
      this.confirmNavAwayDialog = new Dialog({
        title: app.polyglot.t('settings.confirmNavAwayWarning.title'),
        message: app.polyglot.t('settings.confirmNavAwayWarning.message'),
        buttons: [{
          text: app.polyglot.t('settings.btnYes'),
          fragment: 'yes',
        }, {
          text: app.polyglot.t('settings.btnNo'),
          fragment: 'no',
        }],
        dismissOnOverlayClick: false,
        dismissOnEscPress: false,
        showCloseButton: false,
      })
      .on('click-yes', () => {
        this.confirmNavAwayDialog.close();
        this.close(true);
      })
      .on('click-no', () => {
        this.confirmNavAwayDialog.close();
      })
      .render()
      .open();
    } else {
      super.close();
    }
  }

  get $saveStatus() {
    return this._$saveStatus || this.$('.saveStatus');
  }

  render() {
    loadTemplate('modals/settings/settings.html', (t) => {
      this.$el.html(t(this.options));

      super.render();

      this.$tabContent = this.$('.js-tabContent');
      this.$save = this.$('.js-save');
      this._$saveStatus = null;

      this.selectTab(this.$('.js-tab[data-tab="SettingsGeneral"]'));
    });

    return this;
  }
}

