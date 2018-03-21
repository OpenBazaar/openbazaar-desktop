import MetricsModal from '../views/modals/MetricsModal';
import app from '../app';

export function addMetrics() {
  function loadMetrics() {
    // Reverse the countly opt out
    window.localStorage.setItem('cly_ignore', 'false');
    app.localSettings.save({ shareMetricsRestartNeeded: !!window.Countly });

    //  If Countly has already been added, it won't run again until the app is restarted.
    if (window.Countly) return;

    window.Countly = {};
    window.Countly.q = [];
    window.Countly.app_key = '979774c41bab3a6e5232a3630e6e151e439c412e';
    window.Countly.url = 'https://countly.openbazaar.org';
    window.Countly.interval = 4000;
    window.Countly.q.push(['track_sessions']);
    window.Countly.q.push(['track_pageview']);
    window.Countly.q.push(['track_clicks']);
    window.Countly.q.push(['track_scrolls']);
    window.Countly.q.push(['track_errors']);

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
    app.localSettings.save({ shareMetricsRestartNeeded: false });
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
