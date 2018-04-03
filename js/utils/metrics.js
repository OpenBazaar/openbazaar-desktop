import MetricsModal from '../views/modals/MetricsModal';
import app from '../app';
import { version } from '../../package.json';
import * as os from 'os';
import { getCurrentConnection } from './serverConnect';
import { remote } from 'electron';


let metricsRestartNeeded = false;

export function isMetricRestartNeeded() {
  return metricsRestartNeeded;
}

export function addMetrics() {
  function loadMetrics() {
    // Reverse the countly opt out
    window.localStorage.setItem('cly_ignore', 'false');
    metricsRestartNeeded = !!window.Countly;

    //  If Countly has already been added, it won't run again until the app is restarted.
    if (window.Countly) return;

    const sVer = app.settings.get('version');
    const serverVersion = sVer.substring(sVer.lastIndexOf(':') + 1, sVer.lastIndexOf('/'));

    window.Countly = {};
    window.Countly.q = [];
    window.Countly.app_key = '979774c41bab3a6e5232a3630e6e151e439c412e';
    window.Countly.app_version = `client_${version}|server_${serverVersion}`;
    window.Countly.url = 'https://countly.openbazaar.org';
    window.Countly.interval = 30000;
    window.Countly.q.push(['track_sessions']);
    window.Countly.q.push(['track_pageview']);
    window.Countly.q.push(['track_clicks']);
    window.Countly.q.push(['track_scrolls']);
    window.Countly.q.push(['track_errors']);
    // add anonymous details
    window.Countly.q.push(['user_details', {
      custom: {
        vendor: app.profile.get('vendor'),
        listingCount: app.profile.get('stats').get('listingCount'),
        ratingCount: app.profile.get('stats').get('ratingCount'),
        moderator: app.profile.get('moderator'),
        crypto: app.profile.get('currencies'),
        displayCurrency: app.settings.get('localCurrency'),
        displayLanguage: app.localSettings.get('language'),
        systemLanguage: navigator.language,
        bundled: remote.getGlobal('isBundledApp'),
        Tor: getCurrentConnection().server.get('useTor'),
        CPU: os.cpus()[0].model,
        RAMtotal: ((os.totalmem()) / 1048576).toFixed(2),
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
  return app.localSettings.save({ shareMetrics: bool });
}

export function showMetricsModal() {
  const metricsModal = new MetricsModal({
    removeOnClose: true,
    messageClass: 'dialogScrollMsg',
  }).render().open();

  return metricsModal;
}

export function recordEvent(key, segmentation) {
  if (window.Countly) {
    window.Countly.q.push(['add_event',
      {
        key,
        segmentation,
      }]);
  }
}

export function startEvent(key) {
  if (window.Countly) window.Countly.q.push(['start_event', key]);
}

export function endEvent(key, segmentation) {
  if (window.Countly) {
    window.Countly.q.push(['end_event',
      {
        key,
        segmentation,
      }]);
  }
}
