import app from '../app';
import { isHiRez, isLargeWidth, isSmallHeight } from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export { isHiRez };

export { isLargeWidth };

export { isSmallHeight };
