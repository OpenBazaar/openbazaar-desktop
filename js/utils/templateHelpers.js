import app from '../app';
import { getHiRez } from './responsive';
import { getLargeWidth } from './responsive';
import { getSmallHeight } from './responsive';

export function polyT(...args) {
  return app.polyglot.t(...args);
}

export const getServerUrl = app.getServerUrl;

export function hiRez() {
  return getHiRez();
}

export function largeWidth() {
  return getLargeWidth();
}

export function smallHeight() {
  return getSmallHeight();
}
