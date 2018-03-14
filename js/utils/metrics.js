import MetricsModal from '../views/modals/MetricsModal';
import app from '../app';

export function addMetrics() {
  console.log('add metrics')
  function loadMetrics() {
    if (window.Countly) {
      window.Countly.q.push(['opt_in']);
      return;
    }
    window.Countly = {};
    window.Countly.q = [];
    window.Countly.app_key = '979774c41bab3a6e5232a3630e6e151e439c412e';
    window.Countly.url = 'http://countly.openbazaar.org';
    window.Countly.q.push(['track_sessions']);
    window.Countly.q.push(['track_pageview']);
    window.Countly.q.push(['track_clicks']);
    window.Countly.q.push(['track_scrolls']);
    window.Countly.q.push(['track_errors']);

    const scriptEl = document.createElement('script');
    scriptEl.id = 'metricsScrtipt';
    scriptEl.type = 'text/javascript';
    scriptEl.async = true;
    scriptEl.src = 'http://countly.openbazaar.org/sdk/web/countly.min.js';
    scriptEl.onload = () => window.Countly.init();
    (document.getElementsByTagName('head')[0]).appendChild(scriptEl);
  }
  window.addEventListener('load', loadMetrics, false);
  if (document.readyState === 'complete') loadMetrics();
}

export function changeMetrics(bool) {
  console.log(bool)
  console.log(app.localSettings.get('shareMetrics'))
  if (app.localSettings.get('shareMetrics') !== bool) {
    app.localSettings.set('shareMetrics', bool);
    if (bool) addMetrics();
    if (!bool && window.Countly) window.Countly.q.push(['opt_out']);
  }
  console.log(app.localSettings.get('shareMetrics'));
}

export function showMetricsModal() {
  const metricsModal = new MetricsModal({
    showCloseButton: false,
    removeOnClose: true,
  }).render().open();

  return metricsModal;
}
