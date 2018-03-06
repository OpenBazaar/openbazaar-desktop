import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      trackBy: 'DO_NOT_TRACK', // DO_NOT_TRACK, TRACK_BY_FIXED, TRACK_BY_VARIANT
      errors: {},
      ...options.initialState || {},
    };
  }

  events() {
    return {
      'change #editInventoryManagementType': 'onChangeManagementType',
      'change .js-quantityInput': 'onChangeQuantityInput',
    };
  }

  onChangeQuantityInput(e) {
    this._state = {
      ...this._state,
      quantity: e.target.value,
    };
  }

  onChangeManagementType(e) {
    this.trigger('changeManagementType', { value: e.target.value });
  }

  render() {
    loadTemplate('modals/editListing/inventoryManagement.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));

      this.$editInventoryManagementType = this.$('#editInventoryManagementType');

      this.$editInventoryManagementType.select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });
    });

    return this;
  }
}
