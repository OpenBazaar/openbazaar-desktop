import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return `${super.className()} testModal2`;
  }

  events() {
    return {
      'click .jsTestEvent': 'onClickTestEvent',
      ...super.events(),
    };
  }

  onClickTestEvent() {
    alert('who be that yo?');
  }

  render() {
    loadTemplate('modals/testModal2.html', (t) => {
      this.$el.html(t());
      super.render();
    });

    return this;
  }
}
