import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

const names = [
  'Zach Galifianakis',
  'LeBron James',
];

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutContributors',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/contributors.html', (t) => {
      this.$el.html(t({
        names,
      }));
    });

    return this;
  }
}

