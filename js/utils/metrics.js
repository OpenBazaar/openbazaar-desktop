import _ from 'underscore';
import MetricsModal from '../views/modals/MetricsModal';
import app from '../app';
import { version } from '../../package.json';
import { cpus, totalmem, freemem } from 'os';
import { getCurrentConnection } from './serverConnect';
import { remote } from 'electron';


let metricsRestartNeeded = false;

/** Set the returned string to a higher number any time there are changes to the analytics that
 * require a new opt in. This will cause the opt in modal to appear again to users that have
 * previously opted in. It will not show it to users that have opted out.
 */
export const mVersion = 1.0;

export function isNewerVersion() {
  return app.localSettings.get('mVersion') < mVersion;
}

export function prettyRAM(bytes) {
  // from https://gist.github.com/lanqy/5193417
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]})`;
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

export function freeRAMPercentage(total, free) {
  const percentage = free / total * 100;
  return `${percentage.toFixed(1)}%`;
}

export function userStats() {
  const p = app.profile;
  const pErr = 'Profile Not Available';
  const torErr = 'No Current Connection';

  return {
    vendor: p ? p.get('vendor') : pErr,
    listingCount: p ? p.get('stats').get('listingCount') : 0,
    ratingCount: p ? p.get('stats').get('ratingCount') : 0,
    moderator: p ? p.get('moderator') : pErr,
    crypto: p ? p.get('currencies') : pErr,
    displayCurrency: app.settings ? app.settings.get('localCurrency') : 'Settings Not Available',
    displayLanguage: app.localSettings.get('language'),
    bundled: remote.getGlobal('isBundledApp'),
    Tor: getCurrentConnection() ? getCurrentConnection().server.get('useTor') : torErr,
    systemLanguage: navigator.language,
    numberOfCPUs: cpus().length, // how many cores?
    CPU: cpus()[0].model, // how modern/powerful is this computer?
    RAMtotal: prettyRAM(totalmem()), // does the user have enough RAM?
    RAMfree: freeRAMPercentage(totalmem(), freemem()), // is user overburdening their system?
  };
}

export function isMetricRestartNeeded() {
  return metricsRestartNeeded;
}

export function addMetrics() {
  // Never record metrics on testnet
  if (app.serverConfig.testnet) return;

  function loadMetrics() {
    // Reverse the countly opt out in local storage. This is required or nothing will be tracked.
    window.localStorage.setItem('cly_ignore', 'false');
    metricsRestartNeeded = !!window.Countly;

    //  If Countly has already been added, it won't run again until the app is restarted.
    if (window.Countly) return;

    window.Countly = {};
    window.Countly.q = [];
    window.Countly.app_key = '979774c41bab3a6e5232a3630e6e151e439c412e';
    window.Countly.app_version = `client_${version}|server_${app.settings.prettyServerVer}`;
    window.Countly.url = 'https://countly.openbazaar.org';
    window.Countly.interval = 30000;
    window.Countly.q.push(['track_sessions']);
    window.Countly.q.push(['track_pageview', location.hash]);
    window.Countly.q.push(['track_clicks']);
    window.Countly.q.push(['track_links']);
    window.Countly.q.push(['track_scrolls']);
    window.Countly.q.push(['track_errors']);
    // add anonymous details
    window.Countly.q.push(['user_details', {
      custom: {
        ...userStats(),
      },
    }]);

    const scriptEl = document.createElement('script');
    scriptEl.id = 'metricsScrtipt';
    scriptEl.type = 'text/javascript';
    scriptEl.async = true;
    scriptEl.src = 'https://countly.openbazaar.org/sdk/web/countly.min.js';
    scriptEl.onload = () => window.Countly.init();
    (document.getElementsByTagName('head')[0]).appendChild(scriptEl);
  }
  if (document.readyState === 'complete') {
    loadMetrics();
  } else {
    window.addEventListener('load', loadMetrics, false);
  }
}

export function changeMetrics(bool) {
  if (bool) addMetrics();
  if (!bool && window.Countly) {
    metricsRestartNeeded = false;
    window.Countly.q.push(['opt_out']);
  }
  return app.localSettings.save({
    shareMetrics: bool,
    mVersion,
  });
}

export function showMetricsModal(opts) {
  const metricsModal = new MetricsModal({
    removeOnClose: true,
    ...opts,
  }).render().open();

  return metricsModal;
}

export function recordEvent(key, segmentation = {}) {
  if (!key) throw new Error('Please provide a key');
  if (segmentation && !_.isObject(segmentation)) {
    throw new Error('please provide the segmentation as an object');
  }

  if (window.Countly) {
    window.Countly.q.push(['add_event',
      {
        key,
        segmentation,
      }]);
  }
}

export function startAjaxEvent(key) {
  if (window.Countly) window.Countly.q.push(['start_event', key]);
}

export function endAjaxEvent(key, segmentation = {}) {
  if (!key) throw new Error('Please provide a key');
  if (segmentation && !_.isObject(segmentation)) {
    throw new Error('please provide the segmentation as an object');
  }

  if (window.Countly) {
    const seg = {
      errors: 'none',
      ...segmentation,
    };
    window.Countly.q.push(['end_event',
      {
        key,
        segmentation: seg,
      }]);
  }
}

/** Use when a component needs to pass a different prefix for a recorded event, usually passed in by
 * the parent. If no prefix is passed in, the event will be named with just the eventName.
 * @param {string} eventName - The name of the event to record.
 * @param {string} prefix - optional prefix.
 * @param {object} segmentation - optional segmentation object.
 */
export function recordPrefixedEvent(eventName, prefix = '', segmentation = {}) {
  if (!eventName) throw new Error('Please provide an eventName');
  if (typeof segmentation !== 'object' || segmentation === null) {
    throw new Error('please provide the segmentation as an object');
  }
  const prefixed = prefix ? `${prefix}_` : '';
  recordEvent(`${prefixed}${eventName}`, segmentation);
}

/** Use when a component needs to pass a different prefix for the start of an ajax event, usually
 * passed in by the parent. If no prefix is passed in, the event will be named with just the
 * eventName. The start ajax event can be prefixed manually.
 * @param {string} eventName - The name of the event to record.
 * @param {string} prefix - optional prefix.
 */
export function startPrefixedAjaxEvent(eventName, prefix = '') {
  if (!eventName) throw new Error('Please provide an eventName');
  startAjaxEvent(`${prefix}${eventName}`);
}

/** Use when a component needs to pass a different prefix for the end of an ajax event, usually
 * passed in by the parent. If no prefix is passed in, the event will be named with just the
 * eventName. The start ajax event can be prefixed manually.
 * @param {string} eventName - The name of the event to record.
 * @param {string} prefix - optional prefix.
 * @param {object} segmentation - optional segmentation object.
 */
export function endPrefixedAjaxEvent(eventName, prefix = '', segmentation = {}) {
  if (!eventName) throw new Error('Please provide an eventName');
  if (typeof segmentation !== 'object' || segmentation === null) {
    throw new Error('please provide the segmentation as an object');
  }
  const prefixed = prefix ? `${prefix}_` : '';
  endAjaxEvent(`${prefixed}${eventName}`, segmentation);
}
