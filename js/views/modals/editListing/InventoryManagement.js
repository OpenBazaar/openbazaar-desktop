import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      trackBy: 'DO_NOT_TRACK', // DO_NOT_TRACK, TRACK_BY_FIXED, TRACK_BY_VARIANT
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

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = state;
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  // get $deleteConfirm() {
  //   return this._$deleteConfirm ||
  //     (this._$deleteConfirm = this.$('.js-deleteConfirm'));
  // }

  // remove() {
  //   $(document).off('click', this.onDocumentClick);
  //   super.remove();
  // }

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

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
