import $ from 'jquery';
import { Router } from 'backbone';
import { getGuid } from './utils';
import { getPageContainer } from './utils/selectors';
import app from './app';
import UserPage from './views/userPage/UserPage';
import TransactionsPage from './views/TransactionsPage';
import TemplateOnly from './views/TemplateOnly';
import ListingPage from './views/Listing';
import Profile from './models/Profile';
import Listing from './models/listing/Listing';

export default class ObRouter extends Router {
  constructor(options = {}) {
    super(options);
    this.options = options;

    const routes = [
      [/^@([^\/]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)$/, 'userViaHandle'],
      [/^(Qm[a-zA-Z0-9]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)$/, 'user'],
      [/^ownPage[\/]?(.*?)$/, 'ownPage'],
      ['transactions', 'transactions'],
      ['transactions/:tab', 'transactions'],
      // temporary route
      ['listing/:guid/:slug', 'listing'],
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
    const userTab = tab || 'store';
    const pageOpts = { tab: userTab };

    if (userTab === 'channel') {
      pageOpts.category = args[0];
      pageOpts.layer = args[1];
    }

    let profile;
    let profileFetch;
    let onWillRoute;

    if (guid === app.profile.id) {
      // don't fetch our own profile, since we have it already
      profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ id: guid });
      profileFetch = profile.fetch();

      onWillRoute = () => {
        profileFetch.abort();
      };
      this.once('will-route', onWillRoute);
    }

    profileFetch.done(() => {
      this.loadPage(
        new UserPage({
          ...pageOpts,
          model: profile,
        }).render()
      );
    }).fail((jqXhr) => {
      if (jqXhr.statusText !== 'abort') this.userNotFound();
    }).always(() => {
      if (onWillRoute) this.off(null, onWillRoute);
    });
  }

  ownPage(subPath) {
    this.navigate(`${app.profile.id}/${subPath === null ? '' : subPath}`, {
      trigger: true,
      replace: true,
    });
  }

  listing(guid, slug) {
    const listing = new Listing({
      listing: { slug },
    }, { guid });

    let onWillRoute = () => {};
    this.once('will-route', onWillRoute);

    const listingFetch = listing.fetch();

    onWillRoute = () => {
      listingFetch.abort();
    };

    listingFetch.done((jqXhr) => {
      if (jqXhr && jqXhr.statusText === 'abort') return;

      this.loadPage(
        new ListingPage({
          model: listing,
        }).render()
      );
    }).fail((jqXhr) => {
      if (jqXhr.statusText !== 'abort') this.listingNotFound();
    }).always(() => {
      if (onWillRoute) this.off(null, onWillRoute);
    });
  }

  transactions(tab) {
    tab = tab || 'inbound'; // eslint-disable-line no-param-reassign

    this.loadPage(
      new TransactionsPage({ tab }).render()
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

  listingNotFound() {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/listingNotFound.html' }).render()
    );
  }
}
