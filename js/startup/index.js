// Putting start-up related one offs here that are too small for their own module and
// aren't appropriate to be in any existing module

import { screen, shell } from 'electron';
import $ from 'jquery';
import { getBody } from '../utils/selectors';
import app from '../app';
import Backbone from 'backbone';
import TorExternalLinkWarning from '../views/modals/TorExternalLinkWarning';

export function fixLinuxZoomIssue() {
  // fix zoom issue on Linux hiDPI
  if (process.platform === 'linux') {
    let scaleFactor = screen.getPrimaryDisplay().scaleFactor;

    if (scaleFactor === 0) {
      scaleFactor = 1;
    }

    getBody().css('zoom', 1 / scaleFactor);
  }
}

/**
 * For most cases, this handler will be able to identify an external link because
 * it will be prefaced with an "external" protocol (e.g. http, ftp). An exception
 * to this is any user based url (e.g. www.espn.com). In that case, add a
 * 'data-open-external' attribute to the url to force it to be opened externally.
 */
export function handleLinks() {
  $(document).on('click', 'a:not([data-bypass])', (e) => {
    const $a = $(e.target).closest('a');
    const openExternally = $a.data('openExternal') !== undefined;
    let href = $a.attr('href');

    // Anchor without href is likely being handled programatically.
    if (!href) return;

    const link = document.createElement('a');
    link.setAttribute('href', href);

    if (link.protocol !== location.protocol || openExternally) {
      if (link.protocol === 'ob:' && !openExternally) {
        Backbone.history.navigate(href.slice(5), true);
      } else {
        // external link
        const activeServer = app.serverConfigs.activeServer;
        const localSettings = app.localSettings;
        const warningOptedOut = app.localSettings &&
          localSettings.get('dontShowTorExternalLinkWarning');

        if (activeServer && activeServer.get('useTor') && !warningOptedOut) {
          const warningModal = new TorExternalLinkWarning({ url: href })
            .render()
            .open();

          warningModal.on('cancelClick', () => warningModal.close());
          warningModal.on('confirmClick', () => {
            shell.openExternal(link.protocol === 'file:' ? `http://${href}` : href);
            warningModal.close();
          });
        } else {
          shell.openExternal(link.protocol === 'file:' ? `http://${href}` : href);
        }
      }
    } else {
      if (!href.startsWith('#')) {
        href = `#${href}`;
      }

      Backbone.history.navigate(href, true);
    }

    e.preventDefault();
  });
}
