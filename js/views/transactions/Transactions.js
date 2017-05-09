import $ from 'jquery';
import app from '../../app';
import { capitalize } from '../../utils/string';
import { abbrNum } from '../../utils/';
import { getSocket } from '../../utils/serverConnect';
import loadTemplate from '../../utils/loadTemplate';
import Transactions from '../../collections/Transactions';
import baseVw from '../baseVw';
import MiniProfile from '../MiniProfile';
import Tab from './Tab';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialTab: 'purchases',
      ...options,
    };

    super(opts);
    this._tab = opts.initialTab;
    this.tabViewCache = {};
    this.profileDeferreds = {};
    this.profilePosts = [];

    this.purchasesCol = new Transactions([], { type: 'purchases' });

    this.listenTo(this.purchasesCol, 'request', (md, xhr) => {
      xhr.done(data => {
        this.$purchasesTabCount.html(abbrNum(data.totalCount));
      });
    });

    if (opts.initialTab !== 'purchases') {
      // fetch so we get the count for the tabhead
      this.purchasesCol.fetch();
    }

    this.salesCol = new Transactions([], { type: 'sales' });

    this.listenTo(this.salesCol, 'request', (md, xhr) => {
      xhr.done(data => {
        this.$salesTabCount.html(abbrNum(data.totalCount));
      });
    });

    if (opts.initialTab !== 'sales') {
      // fetch so we get the count for the tabhead
      this.salesCol.fetch();
    }

    this.socket = getSocket();
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

  get salesPurchasesDefaultFilter() {
    return {
      search: '',
      sort: 'date-desc',
      state: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
  }

  get salesPurchasesFilterConfig() {
    return [
      {
        id: 'filterPurchasing',
        text: app.polyglot.t('transactions.filters.purchasing'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(0) > -1 ||
          this.salesPurchasesDefaultFilter.state.indexOf(1) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[0, 1]',
        },
      },
      {
        id: 'filterReady',
        text: app.polyglot.t('transactions.filters.ready'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(2) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[2]',
        },
      },
      {
        id: 'filterFulfilled',
        text: app.polyglot.t('transactions.filters.fulfilled'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(3) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[3]',
        },
      },
      {
        id: 'filterRefunded',
        text: app.polyglot.t('transactions.filters.refunded'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(8) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[8]',
        },
      },
      {
        id: 'filterDisputeOpen',
        text: app.polyglot.t('transactions.filters.disputeOpen'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(5) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[5]',
        },
      },
      {
        id: 'filterDisputePending',
        text: app.polyglot.t('transactions.filters.disputePending'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(6) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[6]',
        },
      },
      {
        id: 'filterDisputeClosed',
        text: app.polyglot.t('transactions.filters.disputeClosed'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(7) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[7]',
        },
      },
      {
        id: 'filterCompleted',
        text: app.polyglot.t('transactions.filters.completed'),
        checked: this.salesPurchasesDefaultFilter.state.indexOf(4) > -1 ||
          this.salesPurchasesDefaultFilter.state.indexOf(9) > -1 ||
          this.salesPurchasesDefaultFilter.state.indexOf(10) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[4, 9, 10]',
        },
      },
    ];
  }

  selectTab(targ, options = {}) {
    const opts = {
      addTabToHistory: true,
      ...options,
    };

    if (!this[`create${capitalize(targ)}TabView`]) {
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
        tabView = this[`create${capitalize(targ)}TabView`]();
        this.tabViewCache[targ] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  createPurchasesTabView() {
    const view = this.createChild(Tab, {
      collection: this.purchasesCol,
      type: 'purchases',
      filterConfig: this.salesPurchasesFilterConfig,
      getProfiles: this.getProfiles.bind(this),
    });

    return view;
  }

  createSalesTabView() {
    const view = this.createChild(Tab, {
      collection: this.salesCol,
      type: 'sales',
      filterConfig: this.salesPurchasesFilterConfig,
      getProfiles: this.getProfiles.bind(this),
    });

    return view;
  }

  getProfiles(peerIds = []) {
    const promises = [];
    const profilesToFetch = [];

    peerIds.forEach(id => {
      if (!this.profileDeferreds[id]) {
        const deferred = $.Deferred();
        this.profileDeferreds[id] = deferred;
        profilesToFetch.push(id);
      }

      promises.push(this.profileDeferreds[id].promise());
    });

    if (profilesToFetch.length) {
      const post = $.post({
        url: app.getServerUrl('ob/fetchprofiles?async=true&usecache=true'),
        data: JSON.stringify(profilesToFetch),
        dataType: 'json',
        contentType: 'application/json',
      }).done((data) => {
        if (this.socket) {
          this.listenTo(this.socket, 'message', (e) => {
            if (e.jsonData.id === data.id) {
              this.profileDeferreds[e.jsonData.peerId].resolve(e.jsonData.profile);
            }
          });
        }
      });

      this.profilePosts.push(post);
    }

    return promises;
  }

  get $purchasesTabCount() {
    return this._$purchasesTabCount ||
      (this._$purchasesTabCount = this.$('.js-purchasesTabCount'));
  }

  get $salesTabCount() {
    return this._$salesTabCount ||
      (this._$salesTabCount = this.$('.js-salesTabCount'));
  }

  remove() {
    this.profilePosts.forEach(post => post.abort());
    super.remove();
  }

  render() {
    loadTemplate('transactions/transactions.html', (t) => {
      this.$el.html(t({}));
    });

    this.$tabContent = this.$('.js-tabContent');
    this._$purchasesTabCount = null;

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
