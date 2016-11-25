import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';
import Appearance from './Appearance';
import Server from './Server';
import SMTPIntegration from './SMTPIntegration';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options
    });
    
    // FIXME : expand 
  }

  getFormData() {
    // FIXME : implement
  }

  save() {
    // FIXME : implement
  }

  render() {
    loadTemplate('modals/settings/advanced/settings.html', (t) => {
      this.$el.html(t({
        // FIXME : implement
      }));
      // FIXME : implement
    });
    
    return this;
  }
}
