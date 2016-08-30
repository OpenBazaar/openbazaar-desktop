import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import SimpleMessage from '../SimpleMessage';
import Dialog from '../Dialog';
import BaseModal from '../BaseModal';
import General from './General';
import Page from './Page';
import Addresses from './Addresses';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP clrBr',
      removeOnRoute: false,
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      General,
      Page,
      Addresses,
    };

    this.savesInProgress = 0;

    this.listenTo(app.router, 'will-route', () => {
      this.close(true);
      this.remove();
    });
  }

  className() {
    return `${super.className()} settings modalTop`;
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

        this.listenTo(tabView, 'saving', (...args) => { this.onTabSaving(tabView, ...args); });
        this.listenTo(tabView, 'savingToServer',
          (...args) => { this.onTabSavingToServer(tabView, ...args); });
        this.listenTo(tabView, 'saveComplete',
          (...args) => { this.onTabSaveComplete(tabView, ...args); });

        tabView.render();
      }

      if (tabView instanceof Addresses) {
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

  /*
   * Defers to the save of each tab view. Tab views should communicate they're saving
   * state by triggering the following events:
   * saving - trigger when the save process is initiated.
   * savingToServer - trigger if and when client side validation has passed and
   *   the data is being sent to the server for saving.
   * saveComplete - triggered when the save process completes. Please send the following
   *   arguments to indicate the result of the save:
   *     {boolean} [clientFailed=true] - indicates whether any client side validation failed
   *     {boolean} [serverFailed=false] - indicates whether any server side validation failed
   *     {string} [errorMsg=''] - string describing the error (at this time, this is only
   *       relevant for server side errors)
   */
  save() {
    this.currentTabView.save();
  }

  onTabSaving() {
    this.savesInProgress++;
    this.$save.addClass('processing');
    this.saving = true;
    this.$saveStatus.text('');
  }

  onTabSavingToServer() {
    const msg = {
      msg: app.polyglot.t('settings.statusSaving'),
      type: 'message',
    };

    if (this.statusMessage) {
      clearTimeout(this.statusMessageRemoveTimer);
      this.statusMessage.update(msg);
    } else {
      this.statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });
    }
  }

  onTabSaveComplete(tabView, clientFailed = false, serverFailed = false, errorMsg = '') {
    this.savesInProgress--;

    if (!this.savesInProgress) {
      this.saving = false;
      this.$save.removeClass('processing');

      if (this.statusMessage) {
        this.statusMessageRemoveTimer = setTimeout(() => {
          this.statusMessage.remove();
          this.statusMessage = null;
        }, 3000);
      }
    }

    if (serverFailed) {
      new SimpleMessage({
        title: app.polyglot.t('settings.errors.saveError'),
        message: errorMsg,
      })
      .render()
      .open();

      if (this.statusMessage) {
        this.statusMessage.update({
          msg: app.polyglot.t('settings.statusSaveFailed'),
          type: 'warning',
        });
      }
    } else if (!clientFailed) {
      if (this.confirmNavAwayDialog && this.confirmNavAwayDialog.isOpen()) {
        this.$saveStatus.text(app.polyglot.t('settings.statusSafeToClose'));
      }

      if (this.statusMessage) {
        this.statusMessage.update(app.polyglot.t('settings.statusSaveComplete'));
      }
    }
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

      this.selectTab(this.$('.js-tab[data-tab="General"]'));
    });

    return this;
  }
}

