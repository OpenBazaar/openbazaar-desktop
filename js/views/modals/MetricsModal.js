import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';
import { changeMetrics } from '../../utils/metrics';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);

    this.listenTo(app.localSettings, 'change:shareMetrics', () => this.render());
  }

  className() {
    return `${super.className()} messageModal dialog`;
  }

  events() {
    return {
      'click .js-share': 'onShareClick',
      'click .js-decline': 'onDeclineClick',
      ...super.events(),
    };
  }

  onShareClick() {
    changeMetrics(true)
      .done()
      .fail(() => {
        // the save is to local storage, this shouldn't happen
      });
  }

  onDeclineClick() {
    changeMetrics(false)
      .done()
      .fail(() => {
        // the save is to local storage, this shouldn't happen
      });
  }

  render() {
    loadTemplate('modals/metricsModal.html', (t) => {
      this.$el.html(t({
        shareMetrics: app.localSettings.get('shareMetrics'),
        restartRequired: app.localSettings.get('shareMetricsRestartNeeded'),
      }));
      super.render();
    });

    return this;
  }
}
