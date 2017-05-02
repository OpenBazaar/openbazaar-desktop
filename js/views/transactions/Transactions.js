import $ from 'jquery';
import app from '../../app';
import { capitalize } from '../../utils/string';
import loadTemplate from '../../utils/loadTemplate';
import Transactions from '../../collections/Transactions';
import baseVw from '../baseVw';
import MiniProfile from '../MiniProfile';
import Purchases from './Purchases';
import Sales from './Sales';
import Cases from './Cases';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialTab: 'purchases',
      ...options,
    };

    super(opts);
    this._tab = opts.initialTab;
    this.tabViewCache = {};
    this.tabViews = {
      purchases: Purchases,
      sales: Sales,
      cases: Cases,
    };

    this.purchasesCol = new Transactions([], { type: 'purchases' });
  }

  className() {
    return 'transactions clrS';
  }

  events() {
    return {
      'click .js-tab': 'onTabClick',
    };
  }

  onTabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ.attr('data-tab'));
  }

  selectTab(targ, options = {}) {
    const opts = {
      addTabToHistory: true,
      ...options,
    };

    if (!this.tabViews[targ]) {
      throw new Error(`${targ} is not a valid tab.`);
    }

    let tabView = this.tabViewCache[targ];

    if (!this.currentTabView || this.currentTabView !== tabView) {
      if (opts.addTabToHistory) {
        // subRoute is anything after the tab in the route, which is something
        // we want to maintain, e.g:
        // transactions/<tab>/<slug>/<blah>
        // the subRoute is '/<slug>/<blah>'
        const curRoute = location.hash.startsWith('#ob://') ?
          location.hash.slice(6) : location.hash.slice(1);

        const subRoute = curRoute
          .split('/')
          .slice(2)
          .join('/');

        // add tab to history
        app.router.navigate(`transactions/${targ}${subRoute ? `/${subRoute}` : ''}`);
      }

      this.$('.js-tab').removeClass('clrT active');
      this.$(`.js-tab[data-tab="${targ}"]`).addClass('clrT active');

      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        if (this[`create${capitalize(targ)}TabView`]) {
          tabView = this[`create${capitalize(targ)}TabView`]();
        } else {
          tabView = this.createChild(this.tabViews[targ]);
        }

        this.tabViewCache[targ] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  createPurchasesTabView() {
    const view = this.createChild(Purchases, {
      collection: this.purchasesCol,
    });

    return view;
  }

  render() {
    loadTemplate('transactions/transactions.html', (t) => {
      this.$el.html(t({}));
    });

    this.$tabContent = this.$('.js-tabContent');

    if (this.miniProfile) this.miniProfile.remove();
    this.miniProfile = this.createChild(MiniProfile, {
      model: app.profile,
    });
    this.$('.js-miniProfileContainer').html(this.miniProfile.render().el);

    this.selectTab(this._tab, {
      updateHistory: false,
    });

    return this;
  }
}
