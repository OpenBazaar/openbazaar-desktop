// Putting start-up related one offs here that are too small for their own module and
// aren't appropriate to be in any existing module

import { screen, shell } from 'electron';
import $ from 'jquery';
import Backbone from 'backbone';
import { getBody } from '../utils/selectors';
import twemoji from 'twemoji';
window.twemoji = twemoji;

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
    const $a = $(e.target).closest('a');
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

// todo: move this elsewhere
window.emojiMap = () => {
  const deferred = $.Deferred();

  $.get('http://unicode.org/emoji/charts/full-emoji-list.html#1f468_1f3fb_200d_1f373', (data) => {
    const dataMap = {};
    const $rows = $(data).find('tr');

    $rows.each((i, row) => {
      const $char = $(row).find('.chars');

      if ($char.length) {
        const char = $char.text();

        let name = $(row).find('.name')
          .eq(0)
          .text()
          .replace(/-/g, '_')
          .replace(/\s&\s/g, '_')
          .replace(/\s/g, '_')
          .replace(/[()":’\.'“”]/g, '')
          .toLowerCase();

        name = `:${name}:`;

        twemoji.parse(char, twemojiCode => {
          dataMap[twemojiCode] = name;
        });
      }
    });

    deferred.resolve(dataMap);
  });

  return deferred.promise();
};


window.emojiMap2 = () => {
  const deferred = $.Deferred();

  $.get('http://unicode.org/emoji/charts/full-emoji-list.html#1f468_1f3fb_200d_1f373', (data) => {
    const dataMap = {};
    const $rows = $(data).find('tr');

    $rows.each((i, row) => {
      const $char = $(row).find('.chars');

      if ($char.length) {
        const char = $char.text();

        let name = $(row).find('.name')
          .eq(0)
          .text()
          .replace(/-/g, '_')
          .replace(/\s&\s/g, '_')
          .replace(/\s/g, '_')
          .replace(/[()":’\.'“”]/g, '')
          .toLowerCase();

        name = `:${name}:`;

        dataMap[char] = name;
      }
    });

    deferred.resolve(dataMap);
  });

  return deferred.promise();
};
