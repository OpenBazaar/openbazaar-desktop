import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutStory',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/story.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}

