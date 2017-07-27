import { remote } from 'electron';
import { isMultihash } from '../utils';
import { events as serverConnectEvents, getCurrentConnection } from '../utils/serverConnect';
import Backbone from 'backbone';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import $ from 'jquery';
import {
  launchEditListingModal, launchAboutModal,
  launchWallet, launchSettingsModal,
} from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import { getAvatarBgImage } from '../utils/responsive';
import PageNavServersMenu from './PageNavServersMenu';
import Notifications from './Notifications';

export default class extends BaseVw {
  constructor(options) {
    const opts = {
      events: {
        'click .js-navBack': 'navBackClick',
        'click .js-navFwd': 'navFwdClick',
        'click .js-navReload': 'navReload',
        'click .js-navClose': 'navCloseClick',
        'click .js-navMin': 'navMinClick',
        'click .js-navMax': 'navMaxClick',
        'keyup .js-addressBar': 'onKeyupAddressBar',
        'focusin .js-addressBar': 'onFocusInAddressBar',
        'click .js-navListBtn': 'navListBtnClick',
        'click .js-navSettings': 'navSettingsClick',
        'click .js-navAboutModal': 'navAboutClick',
        'click .js-navWalletBtn': 'navWalletClick',
        'click .js-navCreateListing': 'navCreateListingClick',
        'click .js-navListItem': 'onNavListItemClick',
        'click .js-navList': 'onNavListClick',
        'mouseenter .js-connectedServerListItem': 'onMouseEnterConnectedServerListItem',
        'mouseleave .js-connectedServerListItem': 'onMouseLeaveConnectedServerListItem',
        'mouseenter .js-connManagementContainer': 'onMouseEnterConnManagementContainer',
        'mouseleave .js-connManagementContainer': 'onMouseLeaveConnManagementContainer',
        'click .js-navNotifBtn': 'onClickNavNotifBtn',
        'click .js-notifContainer': 'onClickNotifContainer',
        'click .js-notificationListItem a[href]': 'onClickNotificationLink',
      },
      navigable: false,
      ...options,
    };

    if (!opts.serverConfigs) {
      throw new Error('Please provide a Server Configs collection');
    }

    opts.className = 'pageNav';
    if (!opts.navigable) opts.className += ' notNavigable';
    if (opts.torIndicatorOn) opts.className += ' torIndicatorOn';
    super(opts);
    this.options = opts;
    this.addressBarText = '';

    this.boundOnDocClick = this.onDocClick.bind(this);
    $(document).on('click', this.boundOnDocClick);

    this.listenTo(app.localSettings, 'change:windowControlStyle',
      (_, style) => this.setWinControlsStyle(style));
    this.setWinControlsStyle(app.localSettings.get('windowControlStyle'));

    this.listenTo(serverConnectEvents, 'connected', e => {
      this.$connectedServerName.text(e.server.get('name'))
        .addClass('txB');
      this.listenTo(app.router, 'route:search', this.onRouteSearch);
    });

    this.listenTo(serverConnectEvents, 'disconnected', () => {
      this.$connectedServerName.text(app.polyglot.t('pageNav.notConnectedMenuItem'))
        .removeClass('txB');
      this.torIndicatorOn = false;
      this.stopListening(app.router, null, this.onRouteSearch);
    });

    setTimeout(() => {
      this.toggleNotifications();
    }, 500);
  }

  get navigable() {
    return this.options.navigable;
  }

  set navigable(navigable) {
    const prevNavigable = this.options.navigable;

    this.options.navigable = !!navigable;

    if (this.options.navigable !== prevNavigable) {
      if (this.options.navigable) {
        this.$el.removeClass('notNavigable');
      } else {
        this.$el.addClass('notNavigable');
      }
    }
  }

  get torIndicatorOn() {
    return this.options.torIndicatorOn;
  }

  set torIndicatorOn(bool) {
    if (this.options.torIndicatorOn !== bool) {
      this.options.torIndicatorOn = bool;
      this.$el.toggleClass('torIndicatorOn', bool);
    }
  }

  navBackClick() {
    window.history.back();
  }

  navFwdClick() {
    window.history.forward();
  }

  navReload() {
    app.loadingModal.open();

    // Introducing some fake latency to ensure the loading modal has a chance
    // to appear. Otherwise, views that render quickly (e.g. have cached data)
    // load so fast it may look like pressing the refresh button did nothing.
    setTimeout(() => {
      Backbone.history.loadUrl();
    }, 200);
  }

  setWinControlsStyle(style) {
    if (style !== 'mac' && style !== 'win') {
      throw new Error('Style must be \'mac\' or \'win\'.');
    }

    this.$el.removeClass('winStyleWindowControls macStyleWindowControls');
    this.$el.addClass(style === 'mac' ? 'macStyleWindowControls' : 'winStyleWindowControls');
  }

  setAppProfile() {
    // when this view is created, the app.profile doesn't exist
    this.listenTo(app.profile.get('avatarHashes'), 'change', this.updateAvatar);
    this.render();
  }

  updateAvatar() {
    this.$('#AvatarBtn').attr('style', getAvatarBgImage(app.profile.get('avatarHashes').toJSON()));
  }

  navCloseClick() {
    if (remote.process.platform !== 'darwin') {
      remote.getCurrentWindow().close();
    } else {
      remote.getCurrentWindow().hide();
    }
  }

  navMinClick() {
    remote.getCurrentWindow().minimize();
  }

  navMaxClick() {
    if (remote.getCurrentWindow().isMaximized()) {
      remote.getCurrentWindow().unmaximize();
    } else {
      remote.getCurrentWindow().maximize();
    }
  }

  onRouteSearch() {
    const connectedServer = getCurrentConnection();

    if (connectedServer && connectedServer.server) {
      connectedServer.server.save({ dismissedDiscoverCallout: true });
    }

    this.getCachedEl('.js-discoverCallout').remove();
  }

  onMouseEnterConnectedServerListItem() {
    this.overConnectedServerListItem = true;
    this.$connManagementContainer.addClass('open');
  }

  onMouseLeaveConnectedServerListItem() {
    this.overConnectedServerListItem = false;

    setTimeout(() => {
      if (!this.overConnManagementContainer) {
        this.$connManagementContainer.removeClass('open');
      }
    }, 100);
  }

  onMouseEnterConnManagementContainer() {
    this.overConnManagementContainer = true;
  }

  onMouseLeaveConnManagementContainer() {
    this.overConnManagementContainer = false;

    setTimeout(() => {
      if (!this.overConnectedServerListItem) {
        this.$connManagementContainer.removeClass('open');
      }
    }, 100);
  }

  onNavListItemClick() {
    // Set timeout allows the new page to show before the overlay is removed. Otherwise,
    // there's a flicker frmo the old page to the new page.
    setTimeout(() => {
      this.closeNavMenu();
    });
  }

  navListBtnClick(e) {
    this.closeNotifications();
    this.toggleNavMenu();
    // do not bubble to onDocClick
    e.stopPropagation();
  }

  toggleNavMenu() {
    this.$navList.toggleClass('open');
    this.$navOverlay.toggleClass('open');

    if (!this.$navList.hasClass('open')) {
      this.$connManagementContainer.removeClass('open');
    }
  }

  closeNavMenu() {
    this.$navList.removeClass('open');
    this.$navOverlay.removeClass('open');
    this.$connManagementContainer.removeClass('open');
  }

  onNavListClick(e) {
    console.log('nav list click');
    // do not bubble to onDocClick
    e.stopPropagation();
  }

  onClickNavNotifBtn(e) {
    this.closeNavMenu();
    this.toggleNotifications();
    // do not bubble to onDocClick
    e.stopPropagation();
  }

  toggleNotifications() {
    if (!this.notifications) {
      this.notifications = new Notifications();
      this.getCachedEl('.js-notifContainer').html(this.notifications.render().el);
    }

    this.getCachedEl('.js-notifContainer').toggleClass('open');
    this.$navOverlay.toggleClass('open');
  }

  onClickNotifContainer(e) {
    // do not bubble to onDocClick
    e.stopPropagation();
  }

  closeNotifications() {
    this.$navList.removeClass('open');
    this.getCachedEl('.js-notifContainer').removeClass('open');
    this.$navOverlay.removeClass('open');
  }

  onClickNotificationLink() {
    this.closeNotifications();
  }

  onDocClick() {
    console.log('doc click');
    this.closeNotifications();
    this.closeNavMenu();
  }

  onFocusInAddressBar() {
    this.$addressBar.select();
  }

  onKeyupAddressBar(e) {
    if (e.which === 13) {
      const text = this.$addressBar.val().trim();
      this.$addressBar.val(text);

      const firstTerm = text.startsWith('ob://') ?
        text.slice(5)
          .split(' ')[0]
          .split('/')[0] :
        text.split(' ')[0]
          .split('/')[0];

      if (isMultihash(firstTerm)) {
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else if (firstTerm.charAt(0) === '@' && firstTerm.length > 1) {
        // a handle
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else if (text.startsWith('ob://')) {
        // trying to show a specific page
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else {
        // searching term
        app.router.navigate(`search?q=${encodeURIComponent(text)}`, { trigger: true });
      }
    }
  }

  setAddressBar(text = '') {
    if (this.$addressBar) {
      this.addressBarText = text;
      this.$addressBar.val(text);
    }
  }

  navSettingsClick() {
    launchSettingsModal();
  }

  navAboutClick() {
    launchAboutModal();
    this.closeNavMenu();
  }

  navWalletClick() {
    launchWallet();
  }

  navCreateListingClick() {
    const listingModel = new Listing({}, { guid: app.profile.id });

    launchEditListingModal({
      model: listingModel,
    });
  }

  render() {
    super.render();

    let connectedServer = getCurrentConnection();

    if (connectedServer && connectedServer.status !== 'disconnected') {
      connectedServer = connectedServer.server.toJSON();
    } else {
      connectedServer = null;
    }

    let showDiscoverCallout = false;

    if (connectedServer && !connectedServer.dismissedDiscoverCallout) {
      showDiscoverCallout = true;
    }

    loadTemplate('pageNav.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          addressBarText: this.addressBarText,
          connectedServer,
          testnet: app.serverConfig.testnet,
          walletIconTmpl,
          showDiscoverCallout,
          ...(app.profile && app.profile.toJSON() || {}),
        }));
      });
    });

    if (this.pageNavServersMenu) this.pageNavServersMenu.remove();
    this.pageNavServersMenu = new PageNavServersMenu({
      collection: app.serverConfigs,
    });
    this.$('.js-connManagementContainer').append(this.pageNavServersMenu.render().el);

    this.$addressBar = this.$('.js-addressBar');
    this.$navList = this.$('.js-navList');
    this.$navOverlay = this.$('.js-navOverlay');
    this.$connectedServerName = this.$('.js-connectedServerName');
    this.$connManagementContainer = this.$('.js-connManagementContainer');

    return this;
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }
}
