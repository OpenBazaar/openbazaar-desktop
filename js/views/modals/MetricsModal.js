import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';
import {
  changeMetrics,
  isMetricRestartNeeded,
  mVersion,
  isNewerVersion } from '../../utils/metrics';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);

    this.options = options;

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
      .done(() => {
        this.close();
      })
      .fail(() => {
        // the save is to local storage, this shouldn't happen
        console.log('Saving shareMetrics as true has failed.');
      });
  }

  onDeclineClick() {
    changeMetrics(false)
      .done(() => {
        this.close();
      })
      .fail(() => {
        // the save is to local storage, this shouldn't happen
        console.log('Saving shareMetrics as false has failed.');
      });
  }

  render() {
    loadTemplate('modals/metricsModal.html', (t) => {
      this.$el.html(t({
        showUndecided: this.options.showUndecided,
        shareMetrics: app.localSettings.get('shareMetrics'),
        restartRequired: isMetricRestartNeeded(),
        mVersion,
        showNewMessage: isNewerVersion(),
      }));
      super.render();
    });

    return this;
  }
}
