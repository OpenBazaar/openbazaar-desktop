import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return `${super.className()} loadingModal clrP clrT`;
  }

  render() {
    loadTemplate('modals/loading.html', (t) => {
      this.$el.html(t());
      super.render();
    });

    return this;
  }
}
