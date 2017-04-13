import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.moderatorIDs) {
      throw new Error('Please provide a list of moderator IDs');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'moderators';
  }

  remove() {
    super.remove();
  }

  render() {
    loadTemplate('modals/purchase/moderators.html', t => {
      this.$el.html(t({
      }));

      super.render();
    });

    return this;
  }
}
