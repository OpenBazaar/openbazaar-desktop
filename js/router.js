import { Router } from 'backbone';
import { getGuid } from './utils';

export default class ObRouter extends Router {
  constructor() {
    const routes = [
      // ['home/:state(/:searchText)', 'home'],
      // ['userPage/:userID(/:state)(/:itemHash)(/:skipNSFWmodal)', 'userPage'],
      // [/^@([^\/]+)(.*)$/, 'userPageViaHandle'],
      // ['transactions/:state(/:orderID)(/:tabState)', 'transactions'],
      // ['settings/:state', 'settings'],
      // [/^@([^\/]+)[\/]*(.*)$/, 'routeViaHandle'],
      [/^@([^\/]+)\/transactions[\/]?([^\/]*)$/, 'transactionsViaHandle'],
      [/^(Qm[a-zA-Z0-9]+)\/transactions(:state)$/, 'transactions'],
    ];

    routes.forEach((route) => this.route.apply(this, route));
  }

  transactionsViaHandle(handle, ...args) {
    getGuid(handle).done((guid) => {
      this.transactions(guid, ...args);
    }).fail(() => {
      // redirect to error page
    });
  }

  transactions() {
    // fetch profile
    // - fail: redirecto to error page
    // - done: load transaction view
  }
}
