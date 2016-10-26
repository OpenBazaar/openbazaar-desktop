import ListingShort from '../models/ListingShort';
import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof ListingShort)) {
      throw new Error('Please provide a ListingShort model.');
    }

    if (!options.listingOwnerGuid) {
      throw new Error('Please provide a listingOwnerGuid.');
    }

    this.listenTo(this.model, 'change', this.render);
  }

  className() {
    return 'col clrBr clrT clrP';
  }

  events() {
    return {
      // 'click .js-edit': 'onClickEdit',
    };
  }

  render() {
    loadTemplate('listingShort.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownerGuid: this.options.listingOwnerGuid,
      }));
    });

    return this;
  }
}
