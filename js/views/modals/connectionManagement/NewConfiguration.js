// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'connectionManagementNewConfiguration';
  }

  events() {
    return {
      // 'click .js-save': 'save',
    };
  }

  render() {
    loadTemplate('modals/connectionManagement/newConfiguration.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
