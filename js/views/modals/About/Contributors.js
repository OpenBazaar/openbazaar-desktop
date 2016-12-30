import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutContributors',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/contributors.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}

