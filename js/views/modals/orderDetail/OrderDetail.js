import $ from 'jquery';
import app from '../../../app';
import { capitalize } from '../../../utils/string';
import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import Case from '../../../models/order/Case';
import Profile from '../../../models/profile/Profile';
import BaseModal from '../BaseModal';
import ProfileBox from './ProfileBox';
import Summary from './Summary';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        fetchFailed: false,
        fetchError: '',
      },
      initialTab: 'summary',
      ...options,
    };

    super(opts);
    this._tab = opts.initialTab;
    this.options = opts;
    this.tabViewCache = {};
    this.featuredProfileMd = new Profile();

    if (!this.model) {
      throw new Error('Please provide an Order model.');
    }

    if (typeof opts.getProfiles !== 'function') {
      throw new Error('Please provide a function to retreive profiles.');
    }

    this._state = {
      ...opts.initialState || {},
    };

    this.listenTo(this.model, 'request', this.onOrderRequest);
    this.listenToOnce(this.model, 'sync', this.onFirstOrderSync);
    this.model.fetch();
  }

  className() {
    return `${super.className()} modalScrollPage tabbedModal orderDetail`;
  }

  events() {
    return {
      'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      'click .js-retryFetch': 'onClickRetryFetch',
      'click .js-returnBox': 'onClickReturnBox',
      'click .js-tab': 'onTabClick',
      ...super.events(),
    };
  }

  onOrderRequest(md, xhr) {
    this.setState({
      isFetching: true,
      fetchError: '',
      fetchFailed: false,
    });

    xhr.done(() => {
      this.setState({
        isFetching: false,
        fetchFailed: false,
      });
    }).fail((jqXhr) => {
      if (jqXhr.statusText === 'abort') return;

      let fetchError = '';

      if (jqXhr.responseJSON && jqXhr.responseJSON.reason) {
        fetchError = jqXhr.responseJSON.reason;
      }

      this.setState({
        isFetching: false,
        fetchFailed: true,
        fetchError,
      });
    });
  }

  onFirstOrderSync() {
    this.stopListening(this.model, null, this.onOrderRequest);
    // dummy guid for now
    this.featuredProfileFetch =
      this.options.getProfiles(['Qmai9U7856XKgDSvMFExPbQufcsc4ksG779VyG4Md5dn4J'])[0]
        .done(profile => {
          this.featuredProfileMd.set(profile);
          this.featuredProfile.setState({ isFetching: false });
        });
  }

  onClickRetryFetch() {
    this.model.fetch();
  }

  onClickReturnBox() {
    this.close();
  }

  onTabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ.attr('data-tab'));
  }

  get type() {
    return this.model instanceof Case ? 'case' : this.model.type;
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
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

  createSummaryTabView() {
    const view = this.createChild(Summary, {
      model: this.model,
    });

    return view;
  }

  render() {
    loadTemplate('modals/orderDetail/orderDetail.html', t => {
      const state = this.getState();

      this.$el.html(t({
        id: this.model.id,
        ...state,
        ...this.model.toJSON(),
        ownProfile: app.profile.toJSON(),
        returnText: this.options.returnText,
        type: this.type,
      }));
      super.render();

      this.$tabContent = this.$('.js-tabContent');

      if (this.featuredProfile) this.featuredProfile.remove();
      this.featuredProfile = this.createChild(ProfileBox, {
        model: this.featuredProfileMd,
        initialState: {
          isFetching: !this.featuredProfileFetch ||
            this.featuredProfileFetch.state() === 'pending',
        },
      });
      this.$('.js-featuredProfile').html(this.featuredProfile.render().el);

      if (!state.isFetching && !state.fetchError) {
        this.selectTab(this._tab, {
          addTabToHistory: false,
        });
      }
    });

    return this;
  }
}
