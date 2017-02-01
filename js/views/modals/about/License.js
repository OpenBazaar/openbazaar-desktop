import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutLicense',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/license.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}

