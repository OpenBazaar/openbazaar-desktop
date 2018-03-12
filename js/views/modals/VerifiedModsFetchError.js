import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
      initialState: {
        fetching: false,
        reason: '',
        ...(options.initialState || {}),
      },
    };

    super(opts);
    this.options = opts;
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

  render() {
    loadTemplate('modals/verifiedModsError.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
      super.render();
    });

    return this;
  }
}
