import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  constructor(options = {}) {
    super({
      // className: 'test-with-zest',
      // events: {
      //   click: 'saliva',
      // },
      ...options,
    });

    this.options = options;
  }

  className() {
    return 'arugula';
  }

  render() {
    loadTemplate('modals/testModal.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
