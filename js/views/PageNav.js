import electron from 'electron';
import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';

const remote = electron.remote;

export default class PageNav extends View {
  constructor(options) {
    super({
      className: 'pageNav',
      events: {
        'click .js-navClose': 'navCloseClick',
        'click .js-navMin': 'navMinClick',
        'click .js-navMax': 'navMaxClick',
        'keyup .js-addressBar': 'onKeyupAddressBar',
      },
      ...options,
    });

    this.listenTo(app.localSettings, 'change:mac_style_win_controls',
      this.onWinControlsStyleChange);
    this.setWinControlsStyle(app.localSettings.get('mac_style_win_controls') ? 'mac' : 'win');
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

  getAddressBar() {
    if (this.$addressBar) {
      return this.$addressBar;
    }

    return this.$('.js-addressBar');
  }

  onKeyupAddressBar(e) {
    if (e.which === 13) {
      let text = this.getAddressBar().val();

      if (text.startsWith('ob://')) text = text.slice(5);

      if (text.charAt(0) === '@' && text.length > 1) {
        // a handle
        app.router.navigate((text.split(' ')[0]), { trigger: true });
      } else if (text.indexOf('/') !== -1) {
        // a url
        app.router.navigate(text.replace(' ', ''), { trigger: true });
      } else if (text.startsWith('Qm')) {
        // a guid
        app.router.navigate(text.split(' ')[0], { trigger: true });
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
    this.getAddressBar().val(text);
  }

  render() {
    loadTemplate('pageNav.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
