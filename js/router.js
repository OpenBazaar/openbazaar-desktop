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

export default class ObRouter extends Router {
  constructor(options = {}) {
    super(options);
    this.options = options;

    // Temporarily requiring a dummy 'users' collection. Eventually, we'll
    // be getting this data via fetches to the server
    if (!options.usersCl) {
      throw new Error('Need me some dummy users!');
    }

    this.usersCl = options.usersCl;

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
    app.simpleMessageModal.close();
    app.loadingModal.open();

    if (callback) callback.apply(this, args);
  }

  loadPage(vw) {
    if (this.currentPage) {
      this.currentPage.remove();
    }

    this.currentPage = vw;
    getPageContainer().append(vw.el);
    app.loadingModal.close();
  }

  // Temporary fudge, since we're actually hitting the one name api,
  // but I'd like the guids to match the 2.0 format of being prefaced with Qm.
  // Once we're getting the data from the server, this method will go bye-bye
  // and will directly call getGuid from the util module.
  getGuid(guid) {
    const deferred = $.Deferred();

    getGuid(guid).done((id) => deferred.resolve(`Qm${id}`))
      .fail((...args) => deferred.reject(...args));

    return deferred.promise();
  }

  getUser(guid) {
    const deferred = $.Deferred();
    const user = this.usersCl.get(guid);

    // setting timeout to simulate the latency of an async call
    setTimeout(() => {
      if (user) {
        deferred.resolve(user);
      } else {
        deferred.reject();
      }
    }, parseInt(Math.random() * 1000, 10));

    return deferred.promise();
  }

  userViaHandle(handle, ...args) {
    this.getGuid(handle).done((guid) => {
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

    this.getUser(guid).done((user) => {
      const displayArgs = args.filter((arg) => arg !== null).join('/');
      const handle = user.get('handle');

      this.navigate(`${handle ? `@${handle}` : user.id}/${tab}` +
        `${displayArgs ? `/${displayArgs}` : ''}`, { replace: true });

      this.loadPage(
        new UserPage({
          ...pageOpts,
          model: user,
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
