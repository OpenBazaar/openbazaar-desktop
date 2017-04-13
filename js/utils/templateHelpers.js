import app from '../app';
import { formatCurrency, convertAndFormatCurrency } from './currency';
import {
  isHiRez, isLargeWidth, isSmallHeight, getAvatarBgImage, getListingBgImage,
} from './responsive';
import { upToFixed } from './number';
import twemoji from 'twemoji';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export function parseEmojis(text) {
  return twemoji.parse(text,
      icon => (`../imgs/emojis/72X72/${icon}.png`));
}

export const getServerUrl = app.getServerUrl.bind(app);

export { formatCurrency };

export { convertAndFormatCurrency };

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };

export { getAvatarBgImage };

export { getListingBgImage };

export { upToFixed };
