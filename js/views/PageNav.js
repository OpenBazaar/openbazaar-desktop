import { remote } from 'electron';
import { isMultihash } from '../utils';
import { events as serverConnectEvents, getCurrentConnection } from '../utils/serverConnect';
import Backbone, { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import $ from 'jquery';
import PageNavServersMenu from './PageNavServersMenu';
import {
  launchEditListingModal, launchAboutModal,
  launchWallet, launchSettingsModal,
} from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import { getAvatarBgImage } from '../utils/responsive';

export default class extends View {
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
        'mouseenter .js-connectedServerListItem': 'onMouseEnterConnectedServerListItem',
        'mouseleave .js-connectedServerListItem': 'onMouseLeaveConnectedServerListItem',
        'mouseenter .js-connManagementContainer': 'onMouseEnterConnManagementContainer',
        'mouseleave .js-connManagementContainer': 'onMouseLeaveConnManagementContainer',
      },
      navigable: false,
      ...options,
    };

    if (!opts.serverConfigs) {
      throw new Error('Please provide a Server Configs collection');
    }

    opts.className = `pageNav ${opts.navigable ? '' : 'notNavigable'}`;
    super(opts);
    this.options = opts;
    this.addressBarText = '';

    $(document).on('click', this.onDocClick.bind(this));

    this.listenTo(app.localSettings, 'change:windowControlStyle',
      (_, style) => this.setWinControlsStyle(style));
    this.setWinControlsStyle(app.localSettings.get('windowControlStyle'));

    this.listenTo(serverConnectEvents, 'connected', e => {
      this.$connectedServerName.text(e.server.get('name'))
        .addClass('txB');
    });

    this.listenTo(serverConnectEvents, 'disconnected', () => {
      this.$connectedServerName.text(app.polyglot.t('pageNav.notConnectedMenuItem'))
        .removeClass('txB');
    });
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
      // this.$('.js-navMax').attr('data-tooltip', window.polyglot.t('Maximize'));
    } else {
      remote.getCurrentWindow().maximize();
      // this.$('.js-navMax').attr('data-tooltip', window.polyglot.t('Restore'));
    }
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
    this.closePopMenu();
  }

  navListBtnClick() {
    this.togglePopMenu();
  }

  togglePopMenu() {
    this.$navList.toggleClass('open');
    this.$navOverlay.toggleClass('open');

    if (!this.$navList.hasClass('open')) {
      this.$connManagementContainer.removeClass('open');
    }
  }

  closePopMenu() {
    this.$navList.removeClass('open');
    this.$navOverlay.removeClass('open');
    this.$connManagementContainer.removeClass('open');
  }

  onDocClick(e) {
    if (!this.$navList.hasClass('open')) return;
    if (!$(e.target).closest('.js-navList, .js-navListBtn').length) {
      this.togglePopMenu();
    }
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
    this.togglePopMenu();
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
    let connectedServer = getCurrentConnection();

    if (connectedServer && connectedServer.status !== 'disconnected') {
      connectedServer = connectedServer.server.toJSON();
    } else {
      connectedServer = null;
    }

    loadTemplate('pageNav.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          addressBarText: this.addressBarText,
          connectedServer,
          testnet: app.testnet,
          walletIconTmpl,
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
    $(document).off('click', this.onDocClick);
  }
}
