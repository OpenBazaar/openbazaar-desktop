import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import { splitIntoRows } from '../../../utils';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      ...options,
    });

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.listenTo(this.collection, 'update', this.render);
  }

  events() {
    return {
      'click .js-delete': 'onClickDelete',
    };
  }

  onClickDelete(e) {
    this.trigger('deleteAddress', this.collection.at($(e.target).data('address-index')));
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
