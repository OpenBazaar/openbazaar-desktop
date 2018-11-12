import $ from 'jquery';
import app from '../../../app';
import { capitalize } from '../../../utils/string';
import { getSocket } from '../../../utils/serverConnect';
import { getCurrencyByCode as getWalletCurByCode } from '../../../data/walletCurrencies';
import {
  resolvingDispute,
  events as orderEvents,
} from '../../../utils/order';
import { getCachedProfiles } from '../../../models/profile/Profile';
import loadTemplate from '../../../utils/loadTemplate';
import { recordEvent } from '../../../utils/metrics';
import Case from '../../../models/order/Case';
import OrderFulfillment from '../../../models/order/orderFulfillment/OrderFulfillment';
import OrderDispute from '../../../models/order/OrderDispute';
import ResolveDisputeMd from '../../../models/order/ResolveDispute';
import BaseModal from '../BaseModal';
import ProfileBox from './ProfileBox';
import Summary from './summaryTab/Summary';
import Discussion from './Discussion';
import ContractTab from './contractTab/ContractTab';
import FulfillOrder from './FulfillOrder';
import DisputeOrder from './DisputeOrder';
import ResolveDispute from './ResolveDispute';
import ActionBar from './ActionBar';
import ContractMenuItem from './ContractMenuItem';

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

    if (!this.model) {
      throw new Error('Please provide an Order or Case model.');
    }

    this.listenTo(this.model, 'request', this.onOrderRequest);
    this.listenToOnce(this.model, 'sync', this.onFirstOrderSync);
    this.listenTo(this.model, 'change:unreadChatMessages',
      () => this.setUnreadChatMessagesBadge());

    this.listenTo(orderEvents, 'fulfillOrderComplete', () => {
      if (this.activeTab === 'fulfillOrder') this.selectTab('summary');
    });

    this.listenTo(orderEvents, 'openDisputeComplete', () => {
      if (this.activeTab === 'disputeOrder') this.selectTab('summary');
    });

    this.listenTo(orderEvents, 'resolveDisputeComplete', () => {
      if (this.activeTab === 'resolveDispute') this.selectTab('summary');
    });

    this.listenTo(this.model, 'change:state', () => {
      if (this.actionBar) {
        this.actionBar.setState(this.actionBarButtonState);
      }
    });

    this.listenTo(this.model, 'otherContractArrived', () => {
      if (this.contractMenuItem) {
        this.contractMenuItem.setState(this.contractMenuItemState);
      }
    });

    const socket = getSocket();

    if (socket) {
      this.listenTo(socket, 'message', this.onSocketMessage);
    }

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
    const featuredProfileState = { isFetching: false };
    let featuredProfileFetch;

    if (this.type === 'case') {
      if (this.model.get('buyerOpened')) {
        featuredProfileFetch = this.getBuyerProfile();
        this.featuredProfilePeerId = featuredProfileState.peerID = this.model.buyerId;
      } else {
        featuredProfileFetch = this.getVendorProfile();
        this.featuredProfilePeerId = featuredProfileState.peerID = this.model.vendorId;
      }
    } else if (this.type === 'sale') {
      featuredProfileFetch = this.getBuyerProfile();
      this.featuredProfilePeerId = featuredProfileState.peerID = this.model.buyerId;
    } else {
      featuredProfileFetch = this.getVendorProfile();
      this.featuredProfilePeerId = featuredProfileState.peerID = this.model.vendorId;
    }

    featuredProfileFetch.done(profile => {
      this.featuredProfileMd = profile;
      if (this.featuredProfile) this.featuredProfile.setModel(this.featuredProfileMd);
    });

    if (this.featuredProfile) this.featuredProfile.setState(featuredProfileState);
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

  onSocketMessage(e) {
    const notificationTypes = [
      // A notification for the buyer that a payment has come in for the order. Let's refetch
      // our model so we have the data for the new transaction and can show it in the UI.
      // As of now, the buyer only gets these notifications and this is the only way to be
      // aware of partial payments in realtime.
      'payment',
      // A notification the vendor will get when an offline order has been canceled
      'cancel',
      // A notification the vendor will get when an order has been fully funded
      'order',
      // A notification the buyer will get when the vendor has rejected an offline order.
      'declined',
      // A notification the buyer will get when the vendor has accepted an offline order.
      'orderConfirmation',
      // A notification the buyer will get when the vendor has refunded their order.
      'refund',
      // A notification the buyer will get when the vendor has fulfilled their order.
      'fulfillment',
      // A notification the vendor will get when the buyer has completed an order.
      'orderComplete',
      // When a party opens a dispute the mod and the other party will get this notification
      'disputeOpen',
      // Sent to the moderator when the other party (the one that didn't open the dispute) sends
      // their copy of the contract (which would occur if they were onffline when the dispute was
      // opened and have since come online).
      'disputeUpdate',
      // Notification to the vendor and buyer when a mod has made a decision on an open dispute.
      'disputeClose',
      // Notification the other party will receive when a dispute payout is accepted (e.g. if vendor
      // accepts, the buyer will get this and vice versa).
      'disputeAccepted',
      // Socket received by buyer when the vendor has an error processing an offline order.
      'processingError',
      // Socket received by buyer then the vendor has released funds from escrow after the order
      // and/or dispute timed-out.
      'vendorFinalizedPayment',
    ];

    if (e.jsonData.notification && e.jsonData.notification.orderId === this.model.id) {
      if (notificationTypes.indexOf(e.jsonData.notification.type) > -1) {
        this.model.fetch();
      }
    }

    if (e.jsonData.message &&
       e.jsonData.message.subject === this.model.id &&
       this.activeTab !== 'discussion') {
      const count = this.model.get('unreadChatMessages');
      this.model.set('unreadChatMessages', count + 1);
    }
  }

  get type() {
    return this.model instanceof Case ? 'case' : this.model.type;
  }

  _getParticipantProfile(participantType) {
    const peerId = this.model[`${participantType}Id`];
    const profileKey = `_${participantType}Profile`;

    if (!this[profileKey]) {
      if (peerId === app.profile.id) {
        const deferred = $.Deferred();
        deferred.resolve(app.profile);
        this[profileKey] = deferred.promise();
      } else {
        this[profileKey] = getCachedProfiles([peerId])[0];
      }
    }

    return this[profileKey];
  }

  /**
   * Returns a promise that resolves with the buyer's Profile model.
   */
  getBuyerProfile() {
    return this._getParticipantProfile('buyer');
  }

  /**
   * Returns a promise that resolves with the vendor's Profile model.
   */
  getVendorProfile() {
    return this._getParticipantProfile('vendor');
  }

  /**
   * Returns a promise that resolves with the moderator's Profile model.
   */
  getModeratorProfile() {
    return this._getParticipantProfile('moderator');
  }

  get activeTab() {
    return this._tab;
  }

  selectTab(targ) {
    if (!this[`create${capitalize(targ)}TabView`]) {
      throw new Error(`${targ} is not a valid tab.`);
    }

    this._tab = targ;
    let tabView = this.tabViewCache[targ];

    if (!this.currentTabView || this.currentTabView !== tabView) {
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

      if (tabView.autoFocusFirstField) {
        tabView.$el.find('select, input, textarea')[0].focus();
      }

      this.currentTabView = tabView;
    }
  }

  recordDisputeStart() {
    recordEvent('OrderDetails_DisputeStart', {
      type: this.type,
      state: this.model.get('state'),
    });
  }

  createSummaryTabView() {
    const viewData = {
      model: this.model,
      vendor: {
        id: this.model.vendorId,
        getProfile: this.getVendorProfile.bind(this),
      },
      buyer: {
        id: this.model.buyerId,
        getProfile: this.getBuyerProfile.bind(this),
      },
    };

    if (this.model.moderatorId) {
      viewData.moderator = {
        id: this.model.moderatorId,
        getProfile: this.getModeratorProfile.bind(this),
      };
    }

    const view = this.createChild(Summary, viewData);
    this.listenTo(view, 'clickFulfillOrder',
      () => this.selectTab('fulfillOrder'));
    this.listenTo(view, 'clickResolveDispute', () => {
      recordEvent('OrderDetails_DisputeResolveStart');
      this.selectTab('resolveDispute');
    });
    this.listenTo(view, 'clickDisputeOrder', () => {
      this.recordDisputeStart();
      this.selectTab('disputeOrder');
    });
    this.listenTo(view, 'clickDiscussOrder',
      () => this.selectTab('discussion'));

    return view;
  }

  createDiscussionTabView() {
    const amActiveTab = () => (this.activeTab === 'discussion');
    const viewData = {
      orderId: this.model.id,
      buyer: {
        id: this.model.buyerId,
        getProfile: this.getBuyerProfile.bind(this),
      },
      vendor: {
        id: this.model.vendorId,
        getProfile: this.getVendorProfile.bind(this),
      },
      model: this.model,
      amActiveTab: amActiveTab.bind(this),
    };

    if (this.model.moderatorId) {
      viewData.moderator = {
        id: this.model.moderatorId,
        getProfile: this.getModeratorProfile.bind(this),
      };
    }

    const view = this.createChild(Discussion, viewData);
    this.listenTo(view, 'convoMarkedAsRead', () => {
      this.model.set('unreadChatMessages', 0);
      this.trigger('convoMarkedAsRead');
    });

    return view;
  }

  createContractTabView() {
    const view = this.createChild(ContractTab, {
      model: this.model,
    });

    this.listenTo(view, 'clickBackToSummary', () => this.selectTab('summary'));
    return view;
  }

  // This should not be called on a Case.
  createFulfillOrderTabView() {
    const contract = this.model.get('contract');

    const model = new OrderFulfillment({ orderId: this.model.id },
      {
        contractType: contract.type,
        isLocalPickup: contract.isLocalPickup,
      });

    const view = this.createChild(FulfillOrder, {
      model,
      contractType: contract.type,
      isLocalPickup: contract.isLocalPickup,
    });

    this.listenTo(view, 'clickBackToSummary clickCancel', () => this.selectTab('summary'));

    return view;
  }

  createDisputeOrderTabView() {
    if (this.model.isCase) {
      throw new Error('This view should not be created on Cases.');
    }

    const contract = this.model.get('contract');
    const model = new OrderDispute({ orderId: this.model.id });
    const translationKeySuffix = app.profile.id === this.model.buyerId ?
      'Buyer' : 'Vendor';
    let timeoutMessage = '';

    try {
      timeoutMessage =
        getWalletCurByCode(this.model.paymentCoin).supportsEscrowTimeout ?
          app.polyglot.t(
            `orderDetail.disputeOrderTab.timeoutMessage${translationKeySuffix}`,
            { timeoutAmount: contract.disputeExpiryVerbose }
          ) :
          '';
    } catch (e) {
      // pass
    }

    const view = this.createChild(DisputeOrder, {
      model,
      contractType: contract.type,
      moderator: {
        id: this.model.moderatorId,
        getProfile: this.getModeratorProfile.bind(this),
      },
      timeoutMessage,
    });

    this.listenTo(view, 'clickBackToSummary clickCancel', () => this.selectTab('summary'));

    return view;
  }

  createResolveDisputeTabView() {
    let modelAttrs = { orderId: this.model.id };
    const isResolvingDispute = resolvingDispute(this.model.id);

    // If this order is in the process of the dispute being resolved, we'll
    // populate the model with the data that was posted to the server.
    if (isResolvingDispute) {
      modelAttrs = {
        ...modelAttrs,
        ...isResolvingDispute.data,
      };
    }

    const model = new ResolveDisputeMd(modelAttrs, {
      buyerContractArrived: () => !!this.model.get('buyerContract'),
      vendorContractArrived: () => !!this.model.get('vendorContract'),
      vendorProcessingError: () => this.model.vendorProcessingError,
    });

    const view = this.createChild(ResolveDispute, {
      model,
      case: this.model,
      vendor: {
        id: this.model.vendorId,
        getProfile: this.getVendorProfile.bind(this),
      },
      buyer: {
        id: this.model.buyerId,
        getProfile: this.getBuyerProfile.bind(this),
      },
    });

    this.listenTo(view, 'clickBackToSummary clickCancel', () => this.selectTab('summary'));

    return view;
  }

  setUnreadChatMessagesBadge() {
    this.$unreadChatMessagesBadge.text(this.getUnreadChatMessagesText());
  }

  getUnreadChatMessagesText() {
    let count = this.model.get('unreadChatMessages');
    count = count > 0 ? count : '';
    count = count > 99 ? '…' : count;
    return count;
  }

  /**
   * Returns whether different action bar buttons should be displayed or not
   * based upon the order state.
   */
  get actionBarButtonState() {
    const paymentCurData = this.model.paymentCoinData;

    return {
      showDisputeOrderButton:
        (!paymentCurData || !paymentCurData.supportsEscrowTimeout) &&
        this.model.isOrderDisputable,
    };
  }

  get contractMenuItemState() {
    let tip = '';

    if (this.model.isCase && !this.model.bothContractsValid) {
      const buyerContractAvailableAndInvalid =
        this.model.get('buyerContract') && !this.model.isBuyerContractValid;
      const vendorContractAvailableAndInvalid =
        this.model.get('vendorContract') && !this.model.isVendorContractValid;

      if (buyerContractAvailableAndInvalid && vendorContractAvailableAndInvalid) {
        tip = app.polyglot.t('orderDetail.contractMenuItem.tipBothContractsHaveError');
      } else {
        // "contract" here means the contract we're guaranteed to have
        const isContractValid = this.model.get('buyerOpened') ?
          this.model.isBuyerContractValid : this.model.isVendorContractValid;
        const otherContract = this.model.get('buyerOpened') ?
          this.model.get('vendorContract') : this.model.get('buyerContract');
        const type = this.model.get('buyerOpened') ? 'Buyer' : 'Vendor';
        const otherType = this.model.get('buyerOpened') ? 'Vendor' : 'Buyer';

        if (!isContractValid) {
          tip = app.polyglot.t(`orderDetail.contractMenuItem.tip${type}ContractHasError`);
        }

        if (!otherContract) {
          tip += `${tip ? ' ' : ''}` +
            `${app.polyglot.t(`orderDetail.contractMenuItem.tip${otherType}ContractNotArrived`)}`;
        } else if (!this.model.isContractValid(!this.model.get('buyerOpened'))) {
          tip += `${tip ? ' ' : ''}` +
            `${app.polyglot.t(`orderDetail.contractMenuItem.tip${type}ContractHasError`)}`;
        }
      }
    }

    return { tip };
  }

  get $unreadChatMessagesBadge() {
    return this._$unreadChatMessagesBadge ||
      (this._$unreadChatMessagesBadge = this.$('.js-unreadChatMessagesBadge'));
  }

  render() {
    loadTemplate('modals/orderDetail/orderDetail.html', t => {
      const state = this.getState();

      this.$el.html(t({
        ...state,
        ...this.model.toJSON(),
        returnText: this.options.returnText,
        type: this.type,
        getUnreadChatMessagesText: this.getUnreadChatMessagesText.bind(this),
      }));
      super.render();

      this.$tabContent = this.$('.js-tabContent');
      this._$unreadChatMessagesBadge = null;

      if (this.featuredProfile) this.featuredProfile.remove();
      this.featuredProfile = this.createChild(ProfileBox, {
        model: this.featuredProfileMd || null,
        initialState: {
          isFetching: !this.featuredProfilePeerId,
          peerID: this.featuredProfilePeerId,
        },
      });
      this.$('.js-featuredProfile').html(this.featuredProfile.render().el);

      if (!state.isFetching && !state.fetchError) {
        this.selectTab(this.activeTab);

        if (this.actionBar) this.actionBar.remove();
        this.actionBar = this.createChild(ActionBar, {
          orderId: this.model.id,
          initialState: this.actionBarButtonState,
        });
        this.$('.js-actionBarContainer').html(this.actionBar.render().el);
        this.listenTo(this.actionBar, 'clickOpenDispute', () => {
          this.recordDisputeStart();
          this.selectTab('disputeOrder');
        });

        if (this.contractMenuItem) this.contractMenuItem.remove();
        this.contractMenuItem = this.createChild(ContractMenuItem, {
          initialState: {
            ...this.contractMenuItemState,
          },
        });
        this.getCachedEl('[data-tab="contract"]')
          .replaceWith(this.contractMenuItem.render().el);
      }
    });

    return this;
  }
}

export function checkValidParticipantObject(participant, type) {
  if (typeof participant !== 'object') {
    throw new Error(`Please provide a participant object for the ${type}.`);
  }

  if (typeof type !== 'string') {
    throw new Error('Please provide the participant type as a string.');
  }

  if (!participant.id || typeof participant.getProfile !== 'function') {
    throw new Error(`The ${type} object is not valid. It should have an id ` +
      'as well as a getProfile function that returns a promise that ' +
      'resolves with a profile model.');
  }
}
