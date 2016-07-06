import { Router } from 'backbone';
import { getGuid } from './utils';
import { getPageContainer } from './utils/selectors';
import Channel from './views/Channel';

export default class ObRouter extends Router {
  constructor(options) {
    super(options);

    // Temporarily requiring a dummy 'users' collection. Eventually, we'll
    // be getting this data via fetches to the server
    if (!options.usersCl) {
      throw new Error('Need me some dummy users!');
    }

    this.usersCl = this.options.usersCl;

    const routes = [
      // ['home/:state(/:searchText)', 'home'],
      // ['userPage/:userID(/:state)(/:itemHash)(/:skipNSFWmodal)', 'userPage'],
      // [/^@([^\/]+)(.*)$/, 'userPageViaHandle'],
      // ['transactions/:state(/:orderID)(/:tabState)', 'transactions'],
      // ['settings/:state', 'settings'],
      // [/^@([^\/]+)\/transactions[\/]?([^\/]*)$/, 'transactionsViaHandle'],
      // [/^(Qm[a-zA-Z0-9]+)\/transactions(:state)$/, 'transactions'],
      // [/^@([^\/]+)\/channel[\/]?([^\/]*)[\/]?([^\/]*)$/, 'userViaHandle'],
      // [/^(Qm[a-zA-Z0-9]+)\/transactions$/, 'transactions'],
      // [/^@([^\/]+)$/, 'filly'],
      [/^@([^\/]+)\/channel[\/]?([^\/]*)[\/]?([^\/]*)$/, 'channelViaHandle'],
      [/^(Qm[a-zA-Z0-9]+)\/channel[\/]?([^\/]*)[\/]?([^\/]*)$/, 'channel'],
      ['*path', 'pageNotFound'],
    ];

    routes.slice(0)
      .reverse()
      .forEach((route) => this.route.apply(this, route));
  }

  loadPage() {
    if (this.currentPage) {
      this.currentPage.remove();
    }

    getPageContainer().append();
  }

  channelViaHandle(handle, ...args) {
    getGuid(handle).done((guid) => {
      this.channel(guid, ...args);
    }).fail(() => {
      this.userNotFound();
    });
  }

  channel(guid, category, layer) {
    // fetch profile
    // - fail: redirecto to error page
    // - done: load transaction view
    console.log(`guid: ${guid} cat: ${category} layer: ${layer}`);
    this.loadPage(
      new Channel()
    );
  }

  userNotFound() {
    console.log('user not found - no soup for you');
  }

  pageNotFound() {
    console.log('page not found - no soup for you');
  }
}
