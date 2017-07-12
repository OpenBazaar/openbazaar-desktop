import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} onboarding modalMedium`;
  }

  events() {
    return {
      // 'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      ...super.events(),
    };
  }

  render() {
    loadTemplate('modals/onboarding/onboarding.html', t => {
      loadTemplate('brandingBox.html', brandingBoxT => {
        this.$el.html(t({
          brandingBoxT,
        }));
      });
    });
    super.render();

    return this;
  }
}
