// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'connectionManagementConfigurations';
  }

  events() {
    return {
      'click .js-btnNew': 'onNewClick',
    };
  }

  onNewClick() {
    this.trigger('newClick');
  }

  render() {
    loadTemplate('modals/connectionManagement/configurations.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
