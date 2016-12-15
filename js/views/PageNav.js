import { remote } from 'electron';
import multihashes from 'multihashes';
import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import $ from 'jquery';
import SettingsModal from './modals/Settings/Settings';
import { launchEditListingModal } from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import { isHiRez } from '../utils/responsive';

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
        'click .js-navListBtn': 'navListBtnClick',
        'click .js-navSettings': 'navSettingsClick',
        'click .js-navCreateListing': 'navCreateListingClick',
      },
      navigable: false,
      ...options,
    };

    opts.className = `pageNav ${opts.navigable ? '' : 'notNavigable'}`;
    super(opts);
    this.options = opts;
    this.addressBarText = '';

    $(document).on('click', this.onDocClick.bind(this));

    this.listenTo(app.localSettings, 'change:windowControlStyle',
      (_, style) => this.setWinControlsStyle(style));
    this.setWinControlsStyle(app.localSettings.get('windowControlStyle'));
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
    location.reload();
    // TODO: Only refresh the content not the whole BrowserWindow
    // Backbone.history.loadUrl();
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
    const avatarHashes = app.profile.get('avatarHashes').toJSON();
    const avatarHash = isHiRez() ? avatarHashes.small : avatarHashes.tiny;

    if (avatarHash) {
      this.$('#AvatarBtn').attr('style',
        `background-image: url(${app.getServerUrl(`ipfs/${avatarHash}`)}), 
      url('../imgs/defaultAvatar.png')`);
    }
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

  navListBtnClick() {
    console.log('boom goes MANISHA');
    const $popMenu = this.$navList.hasClass('open') ? '' : this.$navList;
    this.togglePopMenu($popMenu);
  }

  togglePopMenu($popMenu) {
    if ($popMenu) {
      this.$popMenus.not($popMenu).removeClass('open');
      $popMenu.toggleClass('open');
      this.$navOverlay.addClass('open');
    } else {
      this.$popMenus.removeClass('open');
      this.$navOverlay.removeClass('open');
    }
  }

  onDocClick(e) {
    if (!$(e.target).closest('.js-navListBtn, .js-navNotifBtn').length) {
      this.togglePopMenu();
    }
  }

  onKeyupAddressBar(e) {
    if (e.which === 13) {
      let text = this.$addressBar.val().trim();
      this.$addressBar.val(text);

      let isGuid = true;

      if (text.startsWith('ob://')) text = text.slice(5);

      const firstTerm = text.split(' ')[0];

      try {
        multihashes.validate(multihashes.fromB58String(firstTerm));
      } catch (exc) {
        isGuid = false;
      }

      if (isGuid) {
        app.router.navigate(firstTerm, { trigger: true });
      } else if (firstTerm.charAt(0) === '@' && firstTerm.length > 1) {
        // a handle
        app.router.navigate(firstTerm, { trigger: true });
      } else if (text.indexOf('#') !== -1 || text.indexOf(' ') !== -1) {
        // If the term has a hash and/or space in it, we'll consider it to be tag(s)
        const tags = text.trim()
          .replace(',', ' ')
          .replace(/\s+/g, ' ') // collapse multiple spaces into single spaces
          .split(' ')
          .map((frag) => (frag.charAt(0) === '#' ? frag.slice(1) : frag));

        alert(`boom - Searching for tags: ${tags.join(', ')}`);
      } else {
        // it's probably a page route
        app.router.navigate(text, { trigger: true });
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
    if (!this.settingsModal || !this.settingsModal.isOpen()) {
      this.settingsModal = new SettingsModal().render().open();
    }
    this.togglePopMenu();
  }

  navCreateListingClick() {
    const listingModel = new Listing({}, { guid: app.profile.id });

    launchEditListingModal({
      model: listingModel,
    });
  }

  render() {
    let avatarHash = '';

    if (app.profile) {
      const avatarHashes = app.profile.get('avatarHashes').toJSON();

      if (isHiRez() && avatarHashes.small) {
        avatarHash = avatarHashes.small;
      } else if (avatarHashes.tiny) {
        avatarHash = avatarHashes.tiny;
      }
    }

    loadTemplate('pageNav.html', (t) => {
      this.$el.html(t({
        addressBarText: this.addressBarText,
        ...(app.profile && app.profile.toJSON() || {}),
        avatarHash,
      }));
    });

    this.$addressBar = this.$('.js-addressBar');
    this.$navList = this.$('.js-navList');
    this.$popMenus = this.$('.js-navPopMenu');
    this.$navOverlay = this.$('.js-navOverlay');

    return this;
  }

  remove() {
    $(document).off('click', this.onDocClick);
  }
}
