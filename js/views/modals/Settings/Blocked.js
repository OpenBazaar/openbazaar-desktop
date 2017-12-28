// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
// import { openSimpleMessage } from '../SimpleMessage';

export default class extends baseVw {
  // constructor(options = {}) {
  // }

  events() {
    return {
      // 'click .js-save': 'save',
    };
  }

  save() {
  }

  render() {
    super.render();
    loadTemplate('modals/settings/blocked.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}
