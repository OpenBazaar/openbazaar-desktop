import app from '../app';
import { formatCurrency } from './currency';
import { isHiRez, isLargeWidth, isSmallHeight } from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export { formatCurrency };

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };
