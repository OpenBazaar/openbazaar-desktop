import { Router } from 'backbone';

export default class ObRouter extends Router {
  constructor() {
    const routes = [
      // ['home/:state(/:searchText)', 'home'],
      // ['userPage/:userID(/:state)(/:itemHash)(/:skipNSFWmodal)', 'userPage'],
      // [/^@([^\/]+)(.*)$/, 'userPageViaHandle'],
      // ['transactions/:state(/:orderID)(/:tabState)', 'transactions'],
      // ['settings/:state', 'settings'],
    ];

    routes.forEach((route) => this.route.apply(this, route));
  }
}
