import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import SimpleMessage from '../SimpleMessage';
import Dialog from '../Dialog';
import BaseModal from '../BaseModal';
import General from './General';
import Page from './Page';
import Addresses from './Addresses';
import Advanced from './Advanced';


export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
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
      Advanced,
    };

    this.savesInProgress = [];

    this.listenTo(app.router, 'will-route', () => {
      this.close(true);
      this.remove();
    });
  }

  className() {
    return `${super.className()} settings tabbedModal modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
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
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  saveClick() {
    this.save();
  }

  /*
   * Defers to the save of each tab view. Tab views should communicate their saving
   * state by triggering the following event:
   * saving - trigger if and when client side validation has passed and
   *   the data is being sent to the server for saving (or otherwise persisted).
   *   Be sure to provide a promise to the event handler (most likely an xhr) that
   *   resolves whent the process successfully completes and is rejected if the process
   *   fails. If it does fail and you would like an error message displayed in an alert,
   *   please send an error message to the reject handler.
   */
  save() {
    this.currentTabView.save();
  }

  onTabSaving(tabView, savingPromise) {
    if (!(typeof savingPromise === 'object' && typeof savingPromise.then === 'function')) {
      throw new Error('Please provide a promise indicating when the save will finish' +
        ' and whether it succeeds or not');
    }

    this.savesInProgress.push(savingPromise);

    const msg = {
      msg: app.polyglot.t('settings.statusSaving'),
      type: 'message',
    };

    const statusMessage = app.statusBar.pushMessage({
      ...msg,
      duration: 9999999999999999,
    });

    savingPromise.done(() => {
      statusMessage.update({
        msg: app.polyglot.t('settings.statusSaveComplete'),
        type: 'confirmed',
      });
    }).fail((errMsg) => {
      if (errMsg) {
        new SimpleMessage({
          title: app.polyglot.t('settings.errors.saveError'),
          message: errMsg,
        })
        .render()
        .open();
      }

      statusMessage.update({
        msg: app.polyglot.t('settings.statusSaveFailed'),
        type: 'warning',
      });
    }).always(() => {
      delete this.savesInProgress[savingPromise];

      setTimeout(() => {
        statusMessage.remove();
      }, 3000);
    });
  }

  isSaveInProgress() {
    return this.savesInProgress.length;
  }

  close(skipWarning) {
    if (!skipWarning && this.isSaveInProgress()) {
      const confirmNavAwayDialog = new Dialog({
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
        confirmNavAwayDialog.close();
        this.close(true);
      })
      .on('click-no', () => {
        confirmNavAwayDialog.close();
      })
      .render()
      .open();
    } else {
      super.close();
    }
  }

  render() {
    loadTemplate('modals/settings/settings.html', (t) => {
      this.$el.html(t(this.options));
      super.render();

      this.$tabContent = this.$('.js-tabContent');

      this.selectTab(this.$('.js-tab[data-tab="General"]'));
    });

    return this;
  }
}

