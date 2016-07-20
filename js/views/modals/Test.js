import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';
import TestModal2 from './Test2';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return `${super.className()} testModal`;
  }

  events() {
    return {
      'click .jsLaunchChild': 'onClickLaunchChild',
      ...super.events(),
    };
  }

  onClickLaunchChild() {
    new TestModal2().render().open();
  }

  render() {
    loadTemplate('modals/testModal.html', (t) => {
      this.$el.html(t());
      super.render();
    });

    return this;
  }
}
