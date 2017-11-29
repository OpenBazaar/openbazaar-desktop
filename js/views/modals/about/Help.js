import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutHelp',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/help.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}

