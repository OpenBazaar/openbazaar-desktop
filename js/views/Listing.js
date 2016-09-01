import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import { launchEditListingModal } from '../utils/modalManager';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.listenTo(this.model, 'change', this.render);
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  onClickEdit() {
    launchEditListingModal({ model: this.model });
  }

  render() {
    loadTemplate('listing.html', (t) => {
      this.$el.html(t({
        listing: {
          ...this.model.toJSON(),
        },
      }));
    });

    return this;
  }
}
