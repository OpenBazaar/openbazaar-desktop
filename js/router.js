import $ from 'jquery';
import { Router } from 'backbone';
import { getGuid } from './utils';
import { getPageContainer } from './utils/selectors';
import app from './app';
import UserPage from './views/UserPage';
import TransactionsPage from './views/TransactionsPage';
import TemplateOnly from './views/TemplateOnly';
import TestModalsPage from './views/TestModalsPage';
import TestProfilePage from './views/TestProfilePage';
import Profile from './models/Profile';

export default class ObRouter extends Router {
  constructor(options = {}) {
    super(options);
    this.options = options;

    const routes = [
      [/^@([^\/]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)$/, 'userViaHandle'],
      [/^(Qm[a-zA-Z0-9]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)$/, 'user'],
      ['transactions', 'transactions'],
      ['transactions/:tab', 'transactions'],
      ['test-modals', 'testModals'],
      ['test-profile', 'testProfile'],
      ['*path', 'pageNotFound'],
    ];

    routes.slice(0)
      .reverse()
      .forEach((route) => this.route.apply(this, route));

    this.setAddressBarText();

    $(window).on('hashchange', () => {
      this.setAddressBarText();
    });
  }

  setAddressBarText() {
    if (
      location.hash.startsWith('#transactions') ||
      location.hash.startsWith('#test-')
    ) {
      // certain pages should not have their route visible
      // in the address bar
      app.pageNav.setAddressBar('');
    } else {
      app.pageNav.setAddressBar(location.hash.slice(1));
    }
  }

  execute(callback, args) {
    app.loadingModal.open();

    if (callback) {
      this.trigger('will-route');
      callback.apply(this, args);
    }
  }

  loadPage(vw) {
    if (this.currentPage) {
      this.currentPage.remove();
    }

    this.currentPage = vw;
    getPageContainer().append(vw.el);
    app.loadingModal.close();
  }

  userViaHandle(handle, ...args) {
    getGuid(handle).done((guid) => {
      this.user(guid, ...args);
    }).fail(() => {
      this.userNotFound();
    });
  }

  user(guid, tab, ...args) {
    tab = tab || 'store'; // eslint-disable-line no-param-reassign
    const pageOpts = { tab };

    if (tab === 'channel') {
      pageOpts.category = args[0];
      pageOpts.layer = args[1];
    }

    const profile = new Profile({ id: guid });

    profile.fetch().done(() => {
      const displayArgs = args.filter((arg) => arg !== null).join('/');
      const handle = profile.get('handle');

      this.navigate(`${handle ? `@${handle}` : profile.id}/${tab}` +
        `${displayArgs ? `/${displayArgs}` : ''}`, { replace: true });

      this.loadPage(
        new UserPage({
          ...pageOpts,
          model: profile,
        }).render()
      );
    }).fail(() => {
      this.userNotFound();
    });
  }

  transactions(tab) {
    tab = tab || 'inbound'; // eslint-disable-line no-param-reassign

    this.loadPage(
      new TransactionsPage({ tab }).render()
    );
  }

  testModals() {
    this.loadPage(
      new TestModalsPage().render()
    );
  }

  testProfile() {
    this.loadPage(
      new TestProfilePage().render()
    );
  }

  userNotFound() {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/userNotFound.html' }).render()
    );
  }

  pageNotFound() {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/pageNotFound.html' }).render()
    );
  }
}
