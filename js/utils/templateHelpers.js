import app from '../app';
import { formatCurrency } from './currency';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export { formatCurrency };

