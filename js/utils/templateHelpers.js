import app from '../app';
import { formatCurrency, convertAndFormatCurrency } from './currency';
import { isHiRez, isLargeWidth, isSmallHeight } from './responsive';
import sanitizeHtml from 'sanitize-html';
import { htmlFilter } from '../data/security/htmlFilter';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export function sanitize(val) {
  return sanitizeHtml(val, htmlFilter);
}

export const getServerUrl = app.getServerUrl;

export { formatCurrency };

export { convertAndFormatCurrency };

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };
