import $ from 'jquery';
import { Router } from 'backbone';
import { getGuid } from './utils';
import { getPageContainer } from './utils/selectors';
import './lib/whenAll.jquery';
import app from './app';
import UserPage from './views/userPage/UserPage';
import TransactionsPage from './views/TransactionsPage';
import ConnectedPeersPage from './views/ConnectedPeersPage';
import TemplateOnly from './views/TemplateOnly';
import Profile from './models/profile/Profile';
import Listing from './models/listing/Listing';

export default class ObRouter extends Router {
  constructor(options = {}) {
    super(options);
    this.options = options;

    const routes = [
      [/^@([^\/]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'userViaHandle'],
      [/^(Qm[a-zA-Z0-9]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'user'],
      ['transactions(/)', 'transactions'],
      ['transactions/:tab(/)', 'transactions'],
      ['connected-peers(/)', 'connectedPeers'],
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

  standardizedRoute(route = location.hash) {
    let standardized = route;

    if (standardized.startsWith('#')) {
      standardized = standardized.slice(1);
    }

    if (standardized.startsWith('/')) {
      standardized = standardized.slice(1);
    }

    if (standardized.endsWith('/')) {
      standardized = standardized.slice(0, standardized.length - 1);
    }

    return standardized;
  }

  setAddressBarText() {
    const route = this.standardizedRoute();

    if (route.startsWith('transactions')) {
      // certain pages should not have their route visible
      // in the address bar
      app.pageNav.setAddressBar('');
    } else {
      app.pageNav.setAddressBar(route);
    }
  }

  execute(callback, args) {
    app.loadingModal.open();

    this.navigate(this.standardizedRoute(), { replace: true });

    // This block is intentionally duplicated here and in loadPage. It's
    // here because we want to remove any current views (and have them
    // do their remove cleanup) as soon as we know we're matching a new
    // route. Based on some subsequent async fecthes, it may be a little
    // bit of time before loadPage is called.
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
    // This block is intentionally duplicated here in case a route
    // method was called directly on the app.router instance therefore
    // bypassing execute.
    if (this.currentPage) {
      this.currentPage.remove();
      this.currentPage = null;
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
    let listing;
    let listingFetch;

    if (guid === app.profile.id) {
      // don't fetch our own profile, since we have it already
      profileFetch = $.Deferred().resolve();
      profile = app.profile;
    } else {
      profile = new Profile({ peerID: guid });
      profileFetch = profile.fetch();
    }

    if (state === 'store') {
      if (deepRouteParts[0]) {
        listing = new Listing({
          slug: deepRouteParts[0],
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

  connectedPeers() {
    const peerFetch = $.get(app.getServerUrl('ob/peers')).done((peersData) => {
      const peers = peersData.map(peer => (peer.slice(peer.lastIndexOf('/') + 1)));

      this.loadPage(
        new ConnectedPeersPage({ peers }).render()
      );
    }).fail((xhr) => {
      let content = '<p>There was an error retreiving the connected peers.</p>';

      if (xhr.responseText) {
        content += `<p>${xhr.responseJSON && xhr.responseJSON.reason || xhr.responseText}</p>`;
      }

      this.genericError({ content });
    });

    this.once('will-route', () => (peerFetch.abort()));
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

  listingError(failedXhr) {
    if (!failedXhr) {
      throw new Error('Please provide the failed Xhr request');
    }

    if (failedXhr.status === 404) {
      this.listingNotFound();
    } else {
      let content = '<p>There was an error retreiving the listing.</p>';

      if (failedXhr.responseText) {
        const reason = failedXhr.responseJSON && failedXhr.responseJSON.reason ||
          failedXhr.responseText;
        content += `<p>${reason}</p>`;
      }

      this.loadPage(
        new TemplateOnly({ template: 'error-pages/genericError.html' }).render({ content })
      );
    }
  }

  genericError(context = {}) {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/genericError.html' }).render(context)
    );
  }
}
