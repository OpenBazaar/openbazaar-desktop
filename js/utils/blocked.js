import { Model } from 'backbone';
import app from '../app';

function checkAppSettings() {
  if (!app || !(app.settings instanceof Model)) {
    throw new Error('app.settings must be a model.');
  }

  if (!Array.isArray(app.settings.get('blockedNodes'))) {
    throw new Error('app.settings.blockedNodes must be set as an array.');
  }
}

export function isBlocked() {
  checkAppSettings();
}