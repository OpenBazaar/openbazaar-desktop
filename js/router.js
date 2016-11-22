import $ from 'jquery';
import { Router } from 'backbone';
import { getGuid } from './utils';
import { getPageContainer } from './utils/selectors';
import './lib/whenAll.jquery';
import app from './app';
import UserPage from './views/userPage/UserPage';
import TransactionsPage from './views/TransactionsPage';
import TemplateOnly from './views/TemplateOnly';
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

    if (this.currentPage) {
      this.currentPage.remove();
      this.currentPage = null;
    }

    if (callback) {
      this.trigger('will-route');
      callback.apply(this, args);
    }
  }

  loadPage(vw) {
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
    let listing;
    let listingFetch;

    if (guid === app.profile.id) {
      // don't fetch our own profile, since we have it already
      profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ id: guid });
      profileFetch = profile.fetch();
    }

    if (state === 'store') {
      if (deepRouteParts[0]) {
        listing = new Listing({
          listing: { slug: deepRouteParts[0] },
        }, { guid });

        listingFetch = listing.fetch();
      }
    }

    const onWillRoute = () => {
      // The app has been routed to a new route, let's
      // clean up by aborting all fetches
      profileFetch.abort();
      if (listingFetch) listingFetch.abort();
    };

    this.once('will-route', onWillRoute);

    $.whenAll(profileFetch, listingFetch).done(() => {
      this.loadPage(
        new UserPage({
          model: profile,
          state: pageState,
          listing,
        }).render()
      );
    }).fail(() => {
      if (profileFetch.statusText === 'abort' ||
        profileFetch.statusText === 'abort') return;

      // todo: If really not found (404), route to
      // not found page, otherwise display error.
      if (profileFetch.state() === 'rejected') {
        this.userNotFound();
      } else if (listingFetch.state() === 'rejected') {
        this.listingNotFound();
      }
    })
      .always(() => (this.off(null, onWillRoute)));
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
