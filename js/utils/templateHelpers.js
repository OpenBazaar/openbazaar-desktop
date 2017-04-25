import $ from 'jquery';
import app from '../app';
import { formatCurrency, convertAndFormatCurrency } from './currency';
import {
  isHiRez, isLargeWidth, isSmallHeight, getAvatarBgImage,
} from './responsive';
import { upToFixed } from './number';
import twemoji from 'twemoji';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export function parseEmojis(text, className = '', attrs = {}) {
  const parsed = twemoji.parse(text,
      icon => (`../imgs/emojis/72X72/${icon}.png`));
  const $parsed = $(`<div>${parsed}</div>`);

  $parsed.find('img')
    .each((index, img) => {
      const $img = $(img);
      $img.addClass(`emoji ${className}`);

      Object.keys(attrs)
        .forEach(attr => {
          $img.attr(attr, attrs[attr]);
        });
    });

  return $parsed.html();
}

export const getServerUrl = app.getServerUrl.bind(app);

export { formatCurrency };

export { convertAndFormatCurrency };

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };

export { getAvatarBgImage };

export { upToFixed };
