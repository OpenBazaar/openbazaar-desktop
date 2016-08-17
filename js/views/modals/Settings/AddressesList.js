import loadTemplate from '../../../utils/loadTemplate';
import { splitIntoRows } from '../../../utils';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddressesList',
      ...options,
    });

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.collection.on('update', this.render.bind(this));
  }

  render(errors = {}) {
    loadTemplate('modals/settings/addressesList.html', (t) => {
      this.$el.html(t({
        errors,
        addresses: splitIntoRows(this.collection.toJSON(), 2),
      }));
    });

    return this;
  }
}
