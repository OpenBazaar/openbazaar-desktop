import $ from 'jquery';
import app from '../../app';
import { capitalize } from '../../utils/string';
import { abbrNum, deparam } from '../../utils/';
import { getSocket } from '../../utils/serverConnect';
import loadTemplate from '../../utils/loadTemplate';
import Transactions from '../../collections/Transactions';
import Order from '../../models/order/Order';
import Case from '../../models/order/Case';
import baseVw from '../baseVw';
import MiniProfile from '../MiniProfile';
import Tab from './Tab';
import OrderDetail from '../modals/orderDetail/OrderDetail';

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
    this.openedOrderModal = null;

    const params = deparam(location.hash.split('?')[1] || '');
    const orderId = params.orderId;
    const caseId = params.caseId;

    if (orderId || caseId) {
      // cut off the trailing 's' from the tab
      const type = this._tab.slice(0, this._tab.length - 1);

      // If we're opening an order model on init, then we'll
      // need to pass it in to the Tab view. It may need to bind event
      // handlers to it.
      this.openedOrderModal = this.openOrder(orderId || caseId, type);
      this.listenTo(this.openedOrderModal, 'close', () => (this.openedOrderModal = null));
    }

    this.purchasesCol = new Transactions([], { type: 'purchases' });
    this.syncTabHeadCount(this.purchasesCol, () => this.$purchasesTabCount);
    // fetch so we get the count for the tabhead
    this.purchasesCol.fetch();

    this.salesCol = new Transactions([], { type: 'sales' });
    this.syncTabHeadCount(this.salesCol, () => this.$salesTabCount);
    // fetch so we get the count for the tabhead
    this.salesCol.fetch();

    this.casesCol = new Transactions([], { type: 'cases' });
    this.syncTabHeadCount(this.casesCol, () => this.$casesTabCount);
    // fetch so we get the count for the tabhead
    this.casesCol.fetch();

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

  syncTabHeadCount(cl, getCountEl) {
    if (typeof getCountEl !== 'function') {
      throw new Error('Please provide a function that returns a jQuery element ' +
        'containing the tab head count to update.');
    }

    let count;

    this.listenTo(cl, 'request', (md, xhr) => {
      xhr.done(data => {
        let updateCount = false;

        if (typeof count === 'number') {
          if (data.queryCount > count) {
            updateCount = true;
          }
        } else {
          updateCount = true;
        }

        if (updateCount) {
          count = data.queryCount;
          getCountEl.call(this)
            .html(abbrNum(data.queryCount));
        }
      });
    });
  }

  /**
   * This function is also passed into the Tab and Table views. They will
   * be affected should you change the signature or return value.
   */
  openOrder(id, type = 'sale', options = {}) {
    const opts = {
      modalOptions: {
        ...options.modalOptions || {},
      },
      addToRoute: true,
    };

    let model;

    if (type !== 'case') {
      model = new Order({ orderId: id }, { type });
    } else {
      model = new Case({ caseId: id });
    }

    const orderDetail = new OrderDetail({
      model,
      removeOnClose: true,
      returnText: app.polyglot.t(`transactions.${type}s.returnToFromOrder`),
      ...opts.modalOptions,
    });

    orderDetail.render().open();

    if (opts.addToRoute) {
      // add the order / case id to the url
      const params = deparam(location.hash.split('?')[1] || '');
      delete params.orderId;
      delete params.caseId;
      params[type === 'case' ? 'caseId' : 'orderId'] = id;
      app.router.navigate(`${location.hash.split('?')[0]}?${$.param(params)}`);
    }

    // remove it from the url on close of the modal
    const onClose = () => {
      const params = deparam(location.hash.split('?')[1] || '');
      delete params.orderId;
      delete params.caseId;
      app.router.navigate(`${location.hash.split('?')[0]}?${$.param(params)}`);
    };

    this.listenTo(orderDetail, 'close', onClose);

    // Do not alter the url if the user is routing to a new route. The
    // user has already altered the url.
    this.listenTo(app.router, 'will-route', () => {
      this.stopListening(orderDetail, 'close', onClose);
    });

    // On any changes to the order / case detail model state, we'll update the
    // state in the correponding model in the respective collection driving
    // the transaction table.
    this.listenTo(model, 'change:state', (md, state) => {
      let col = this.purchasesCol;

      if (type === 'sale') {
        col = this.salesCol;
      } else if (type === 'case') {
        col = this.casesCol;
      }

      const collectionMd = col.get(model.id);
      if (collectionMd) {
        collectionMd.set('state', state);
      }
    });

    return orderDetail;
  }

  get salesPurchasesDefaultFilter() {
    return {
      search: '',
      sortBy: 'UNREAD',
      states: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    };
  }

  get salesPurchasesFilterConfig() {
    return [
      {
        id: 'filterPurchasing',
        text: app.polyglot.t('transactions.filters.purchasing'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(0) > -1 ||
          this.salesPurchasesDefaultFilter.states.indexOf(1) > -1,
        className: 'filter',
        targetState: [0, 1],
      },
      {
        id: 'filterReady',
        text: app.polyglot.t('transactions.filters.ready'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(2) > -1,
        className: 'filter',
        targetState: [2, 3, 4],
      },
      {
        id: 'filterFulfilled',
        text: app.polyglot.t('transactions.filters.fulfilled'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(3) > -1,
        className: 'filter',
        targetState: [5],
      },
      {
        id: 'filterRefunded',
        text: app.polyglot.t('transactions.filters.refunded'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(9) > -1,
        className: 'filter',
        targetState: [9],
      },
      {
        id: 'filterDisputeOpen',
        text: app.polyglot.t('transactions.filters.disputeOpen'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(10) > -1,
        className: 'filter',
        targetState: [10],
      },
      {
        id: 'filterDisputePending',
        text: app.polyglot.t('transactions.filters.disputePending'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(11) > -1,
        className: 'filter',
        targetState: [11],
      },
      {
        id: 'filterDisputeClosed',
        text: app.polyglot.t('transactions.filters.disputeClosed'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(12) > -1,
        className: 'filter',
        targetState: [12],
      },
      {
        id: 'filterCompleted',
        text: app.polyglot.t('transactions.filters.completed'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(6) > -1 ||
          this.salesPurchasesDefaultFilter.states.indexOf(7) > -1 ||
          this.salesPurchasesDefaultFilter.states.indexOf(8) > -1,
        className: 'filter',
        targetState: [6, 7, 8],
      },
    ];
  }

  get casesDefaultFilter() {
    return {
      search: '',
      sortBy: 'UNREAD',
      states: [10, 12],
    };
  }

  get casesFilterConfig() {
    return [
      {
        id: 'filterDisputeOpen',
        text: app.polyglot.t('transactions.filters.disputeOpen'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(10) > -1,
        className: 'filter',
        targetState: [10],
      },
      {
        id: 'filterDisputeClosed',
        text: app.polyglot.t('transactions.filters.disputeClosed'),
        checked: this.salesPurchasesDefaultFilter.states.indexOf(12) > -1,
        className: 'filter',
        targetState: [12],
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
        // add tab to history
        app.router.navigate(`transactions/${targ}`);
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

      if (typeof tabView.onAttach === 'function') {
        tabView.onAttach.call(tabView);
      }

      this.currentTabView = tabView;
    }
  }

  get filterUrlParams() {
    const params = deparam(location.hash.split('?')[1] || '');

    if (params.states) {
      params.states = params.states
        .split('-')
        .map(strIndex => parseInt(strIndex, 10))
        .filter(state => !isNaN(state));
    } else {
      delete params.states;
    }

    return params;
  }

  createPurchasesTabView() {
    const view = this.createChild(Tab, {
      collection: this.purchasesCol,
      type: 'purchases',
      defaultFilter: {
        ...this.salesPurchasesDefaultFilter,
      },
      initialFilter: {
        ...this.salesPurchasesDefaultFilter,
        ...this.filterUrlParams,
      },
      filterConfig: this.salesPurchasesFilterConfig,
      openOrder: this.openOrder.bind(this),
      openedOrderModal: this.openedOrderModal,
    });

    return view;
  }

  createSalesTabView() {
    const view = this.createChild(Tab, {
      collection: this.salesCol,
      type: 'sales',
      defaultFilter: {
        ...this.salesPurchasesDefaultFilter,
      },
      initialFilter: {
        ...this.salesPurchasesDefaultFilter,
        ...this.filterUrlParams,
      },
      filterConfig: this.salesPurchasesFilterConfig,
      openOrder: this.openOrder.bind(this),
      openedOrderModal: this.openedOrderModal,
    });

    return view;
  }

  createCasesTabView() {
    const view = this.createChild(Tab, {
      collection: this.casesCol,
      type: 'cases',
      defaultFilter: {
        ...this.casesDefaultFilter,
      },
      initialFilter: {
        ...this.casesDefaultFilter,
        ...this.filterUrlParams,
      },
      filterConfig: this.casesFilterConfig,
      openOrder: this.openOrder.bind(this),
      openedOrderModal: this.openedOrderModal,
    });

    return view;
  }

  get $purchasesTabCount() {
    return this._$purchasesTabCount ||
      (this._$purchasesTabCount = this.$('.js-purchasesTabCount'));
  }

  get $salesTabCount() {
    return this._$salesTabCount ||
      (this._$salesTabCount = this.$('.js-salesTabCount'));
  }

  get $casesTabCount() {
    return this._$casesTabCount ||
      (this._$casesTabCount = this.$('.js-casesTabCount'));
  }

  render() {
    loadTemplate('transactions/transactions.html', (t) => {
      this.$el.html(t({}));
    });

    this.$tabContent = this.$('.js-tabContent');
    this._$purchasesTabCount = null;
    this._$salesTabCount = null;
    this._$casesTabCount = null;

    if (this.miniProfile) this.miniProfile.remove();
    this.miniProfile = this.createChild(MiniProfile, {
      model: app.profile,
    });
    this.$('.js-miniProfileContainer').html(this.miniProfile.render().el);

    this.selectTab(this._tab, {
      addTabToHistory: false,
    });

    return this;
  }
}
