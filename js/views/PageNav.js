import electron from 'electron';
import multihashes from 'multihashes';
import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import $ from 'jquery';
import SettingsModal from './modals/Settings/Settings';
import { launchEditListingModal } from '../utils/modalManager';
import Listing from '../models/listing/Listing';

const remote = electron.remote;

export default class extends View {
  constructor(options) {
    const opts = {
      events: {
        'click .js-navBack': 'navBackClick',
        'click .js-navFwd': 'navFwdClick',
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
    $(document).on('click', this.onDocClick.bind(this));

    this.listenTo(app.localSettings, 'change:macStyleWinControls',
      this.onWinControlsStyleChange);
    this.setWinControlsStyle(app.localSettings.get('macStyleWinControls') ? 'mac' : 'win');
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

  setWinControlsStyle(style) {
    if (style !== 'mac' && style !== 'win') {
      throw new Error('Style must be \'mac\' or \'win\'.');
    }

    this.$el.removeClass('winStyleWindowControls macStyleWindowControls');
    this.$el.addClass(style === 'mac' ? 'macStyleWindowControls' : 'winStyleWindowControls');
  }

  onWinControlsStyleChange(model, useMacStyle) {
    this.setWinControlsStyle(useMacStyle ? 'mac' : 'win');
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

      // temporary way to check for GUIDs, since our dummy guids from
      // start.js aren't valid v2 guids, but are registered with the
      // one-name api.
      if (firstTerm.startsWith('Qm')) isGuid = true;
      // end - temporary guid check

      if (isGuid) {
        app.router.navigate(firstTerm, { trigger: true });
      } else if (firstTerm.charAt(0) === '@' && firstTerm.length > 1) {
        // a handle
        app.router.navigate(firstTerm, { trigger: true });
      } else if (text.startsWith('listing/')) {
        // temporary to handle temporary listing route
        app.router.navigate(text, { trigger: true });
      } else {
        // tag(s)
        const tags = text.trim()
          .replace(',', ' ')
          .replace(/\s+/g, ' ') // collapse multiple spaces into single spaces
          .split(' ')
          .map((frag) => (frag.charAt(0) === '#' ? frag.slice(1) : frag));

        alert(`boom - Searching for tags: ${tags.join(', ')}`);
      }
    }
  }

  setAddressBar(text = '') {
    if (this.$addressBar) {
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
    const listingModel = new Listing();

    launchEditListingModal({
      model: listingModel,
    });
  }

  render() {
    loadTemplate('pageNav.html', (t) => {
      this.$el.html(t());
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
