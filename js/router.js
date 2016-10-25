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

  get userStates() {
    return [
      'home',
      'store',
      'following',
      'followers',
    ];
  }


  /**
   * Based on the route arguments, determine whether we
   * have a valid user route.
   */
  isValidUserRoute(guid, state, ...deepRouteParts) {
    if (!guid || this.userStates.indexOf(state) === -1) {
      return false;
    }

    if (state === 'store') {
      // so far store is the only state that could have
      // route parts beyond the state, e.g @themes/store/<slug>
      if (deepRouteParts.length > 1) {
        return false;
      }
    } else if (deepRouteParts.length) {
      return false;
    }

    return true;
  }

  user(guid, state, ...args) {
    const pageState = state || 'store';
    const deepRouteParts = args.filter(arg => arg !== null);

    if (!state) {
      this.navigate(`${guid}/store${deepRouteParts ? deepRouteParts.join('/') : ''}`, {
        replace: true,
      });
    }

    if (!this.isValidUserRoute(guid, pageState, ...deepRouteParts)) {
      this.pageNotFound();
      return;
    }

    let profile;
    let profileFetch;
    let onWillRoute;

    const pageOpts = {
      state: pageState,
    };

    if (state === 'store' && deepRouteParts[0]) {
      pageOpts.listing = deepRouteParts[0];
    }

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
          model: profile,
          ...pageOpts,
        }).render()
      );
    }).fail((jqXhr) => {
      if (jqXhr.statusText !== 'abort') this.userNotFound();
    }).always(() => {
      if (onWillRoute) this.off(null, onWillRoute);
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
