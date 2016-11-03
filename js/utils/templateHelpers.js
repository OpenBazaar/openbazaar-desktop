import app from '../app';
import { formatCurrency } from './currency';
import { getHiRez, getLargeWidth, getSmallHeight } from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export { formatCurrency };

export { getHiRez };

export { getLargeWidth };

export { getSmallHeight };
