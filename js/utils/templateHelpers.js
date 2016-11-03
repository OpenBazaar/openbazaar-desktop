import app from '../app';
import { getHiRez, getLargeWidth, getSmallHeight } from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export { getHiRez };

export { getLargeWidth };

export { getSmallHeight };
