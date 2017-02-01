import app from '../app';
import { formatCurrency, convertAndFormatCurrency } from './currency';
import {
  isHiRez, isLargeWidth, isSmallHeight, getAvatarBgImage,
} from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl.bind(app);

export { formatCurrency };

export { convertAndFormatCurrency };

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };

export { getAvatarBgImage };
