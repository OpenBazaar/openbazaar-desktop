import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';
import { changeMetrics } from '../../utils/metrics';

export default class extends BaseModal {
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
    changeMetrics(true);
    this.close();
  }

  onDeclineClick() {
    changeMetrics(false);
    this.close();
  }

  render() {
    loadTemplate('modals/metricsModal.html', (t) => {
      this.$el.html(t({
        shareMetrics: app.localSettings.get('shareMetrics'),
      }));
      super.render();
    });

    return this;
  }
}
