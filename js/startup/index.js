// Putting one offs here that are too small for their own module and
// aren't appropriate to be in any existing module

import { screen, shell } from 'electron';
import $ from 'jquery';
import Backbone from 'backbone';
import { getBody } from '../utils/selectors';
import { findAncestorByTag } from '../utils/dom';

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

export function handleLinks() {
  $(document).on('click', 'a:not([data-bypass])', (e) => {
    let $a;

    if (e.target.tagName === 'A') {
      $a = $(e.target);
    } else {
      $a = $(findAncestorByTag(e.target, 'A'));
    }

    let href = $a.attr('href');

    // Anchor without href is likely being handled programatically.
    if (!href) return;

    const link = document.createElement('a');
    link.setAttribute('href', href);

    if (link.protocol !== location.protocol) {
      // external link
      if (link.protocol === 'ob2:') {
        Backbone.history.navigate(href.slice(6), true);
      } else {
        shell.openExternal(href);
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
