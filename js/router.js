import $ from 'jquery';
import { Router } from 'backbone';
import { getGuid, isMultihash } from './utils';
import { getPageContainer } from './utils/selectors';
import './lib/whenAll.jquery';
import app from './app';
import UserPage from './views/userPage/UserPage';
import Search from './views/search/Search';
import Transactions from './views/transactions/Transactions';
import ConnectedPeersPage from './views/ConnectedPeersPage';
import TemplateOnly from './views/TemplateOnly';
import Profile from './models/profile/Profile';
import Listing from './models/listing/Listing';

export default class ObRouter extends Router {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.guidHandleMap = new Map();

    const routes = [
      [/^(?:ob:\/\/)@([^\/]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'userViaHandle'],
      [/^@([^\/]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'userViaHandle'],
      [/^(?:ob:\/\/)(Qm[a-zA-Z0-9]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'user'],
      [/^(Qm[a-zA-Z0-9]+)[\/]?([^\/]*)[\/]?([^\/]*)[\/]?([^\/]*)\/?$/, 'user'],
      ['(ob://)transactions(/)', 'transactions'],
      ['(ob://)transactions/:tab(/)', 'transactions'],
      ['(ob://)connected-peers(/)', 'connectedPeers'],
      ['(ob://)search(?query)', 'search'],
      ['(ob://)*path', 'pageNotFound'],
    ];

    routes.slice(0)
      .reverse()
      .forEach((route) => this.route.apply(this, route));

    this.setAddressBarText();

    $(window).on('hashchange', () => {
      this.setAddressBarText();
    });

    console.log('cache');
    window.cache = this.guidHandleMap;

    // todo - clear old entries from map
  }

  get maxCachedHandles() {
    return 1000;
  }

  // todo: doc me up. to remove send in empty handle.
  cacheGuidHandle(guid, handle) {
    if (typeof guid !== 'string') {
      throw new Error('Please provide a guid as a string.');
    }

    if (typeof handle !== 'string') {
      throw new Error('Please provide a handle as a string.');
    }

    if (!handle) {
      this.guidHandleMap.delete(guid);
      return;
    }

    const keys = Array.from(this.guidHandleMap.keys());
    if (!this.guidHandleMap.get(guid) && keys.length >= this.maxCachedHandles) {
      // We're already at or over the limit, so we need to remove one from the cache to
      // make room for the new one.
      this.guidHandleMap.delete(keys[keys.length - 1]);
    }

    this.guidHandleMap.set(guid, {
      handle,
      created: Date.now(),
    });
  }

  standardizedRoute(route = location.hash, options = {}) {
    const opts = {
      replaceGuidWithHandle: true, // if available in cache
      ...options,
    };

    let standardized = route;

    if (standardized.startsWith('#')) {
      standardized = standardized.slice(1);
    }

    if (standardized.startsWith('/')) {
      standardized = standardized.slice(1);
    }

    if (standardized.startsWith('ob://')) {
      standardized = standardized.slice(5);
    }

    if (standardized.endsWith('/')) {
      standardized = standardized.slice(0, standardized.length - 1);
    }

    const split = standardized.split('/');

    if (opts.replaceGuidWithHandle && isMultihash(split[0])) {
      console.log('yup');
      const handleObj = this.guidHandleMap.get(split[0]);

      if (handleObj) {
        console.log('yuppers');
        standardized =
          `@${handleObj.handle}${split.length > 1 ? `/${split.slice(1).join('/')}` : ''}`;
        console.log(`pre: ${standardized}`);
      } else {
        console.log('nopers');
      }
    } else {
      console.log('nope');
    }

    console.log(`the gold standard is ${standardized}`);

    return standardized;
  }

  setAddressBarText(route = this.standardizedRoute()) {
    let displayRoute;

    if (!route) {
      displayRoute = '';
    } else {
      displayRoute = route.startsWith('ob://') ? route : `ob://${route}`;
    }

    app.pageNav.setAddressBar(displayRoute);
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

  // todo: DOC me up yo
  navigateUser(fragment, guid, options = {}) {
    if (typeof fragment !== 'string') {
      throw new Error('Please provide a fragment as a string.');
    }

    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    let guidRoute = fragment;
    const split = fragment.split('/');

    if (split[0].startsWith('@')) {
      this.cacheGuidHandle(guid, split[0].slice(1));
      guidRoute = [guid].concat(split.slice(1)).join('/');
    }

    // First we'll use the standard navigate to set the route with
    // the guid in place of the handle. This will put the guid version
    // both in history and in the address bar.

    // todo: those good? ^ ^ ^
    console.log(`boom: ${guidRoute}`);
    super.navigate(guidRoute, options);

    // Now, we'll set the address bar with the provided fragment (which
    // probably has the handle in it if it was available).
    // setTimeout(() => {
    //   this.setAddressBarText(fragment);
    // });
  }

  userViaHandle(handle, ...args) {
    getGuid(handle).done((guid) => {
      this.user(guid, ...args);
    }).fail(() => {
      this.userNotFound(handle);
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
      const handle = profile.get('handle');
      this.cacheGuidHandle(guid, handle);
      if (handle) this.setAddressBarText();

      if (pageState === 'store' && !profile.get('vendor') && guid !== app.profile.id) {
        // the user does not have an active store and this is not our own node
        if (state) {
          // You've explicitly tried to navigate to the store tab. Since it's not
          // available, we'll re-route to page-not-found
          this.pageNotFound();
          return;
        }

        // You've attempted to find a user with no particular tab. Since store is not available
        // we'll take you to the home tab.
        this.navigate(`${guid}/home/${deepRouteParts ? deepRouteParts.join('/') : ''}`, {
          replace: true,
          trigger: true,
        });
        return;
      }

      if (!state) {
        this.navigate(`${guid}/store/${deepRouteParts ? deepRouteParts.join('/') : ''}`, {
          replace: true,
        });
      }

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
        this.userNotFound(guid);
      } else if (listingFetch.state() === 'rejected') {
        this.listingNotFound(deepRouteParts[0], `${guid}/${pageState}`);
      }
    })
      .always(() => (this.off(null, onWillRoute)));
  }

  transactions(tab) {
    if (tab && ['sales', 'cases', 'purchases'].indexOf(tab) === -1) {
      this.pageNotFound();
      return;
    }

    if (!tab) {
      this.navigate('transactions/sales');
    }

    this.loadPage(
      new Transactions({ initialTab: tab || 'sales' }).render()
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

  search(query) {
    this.loadPage(
      new Search({ query })
    );
  }

  userNotFound(user) {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/userNotFound.html' }).render({ user })
    );
  }

  pageNotFound() {
    this.loadPage(
      new TemplateOnly({
        template: 'error-pages/pageNotFound.html',
      }).render()
    );
  }

  listingNotFound(listing, link) {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/listingNotFound.html' }).render({ listing, link })
    );
  }

  listingError(failedXhr, listing, storeUrl) {
    if (!failedXhr) {
      throw new Error('Please provide the failed Xhr request');
    }

    if (failedXhr.status === 404) {
      this.listingNotFound(listing, storeUrl);
    } else {
      let failErr = '';

      if (failedXhr.responseText) {
        const reason = failedXhr.responseJSON && failedXhr.responseJSON.reason ||
          failedXhr.responseText;
        failErr += `\n\n${reason}`;
      }

      this.loadPage(
        new TemplateOnly({ template: 'error-pages/listingError.html' })
          .render({
            listing,
            storeUrl,
            failErr,
          })
      );
    }
  }

  genericError(context = {}) {
    this.loadPage(
      new TemplateOnly({ template: 'error-pages/genericError.html' }).render(context)
    );
  }
}
