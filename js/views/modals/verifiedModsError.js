import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      showCloseButton: true,
      dismissOnEscPress: true,
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  set reason(r) {
    this._reason = r;
  }

  className() {
    return `${super.className()} messageModal dialog`;
  }

  events() {
    return {
      'click .js-retry': 'onRetryClick',
      'click .js-continue': 'onContinueClick',
      ...super.events(),
    };
  }

  onRetryClick() {
    this.trigger('retry');
  }

  onContinueClick() {
    this.trigger('continue');
    this.close();
  }

  toggleRetryProcessing(bool) {
    this.getCachedEl('.js-retry').toggleClass('processing', bool);
  }

  render() {
    loadTemplate('modals/verifiedModsError.html', (t) => {
      this.$el.html(t({
        ...this.options,
      }));
      super.render();
    });

    return this;
  }
}
