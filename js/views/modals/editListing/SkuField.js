import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!options.model) {
      throw new Error('Please provide an item model.');
    }

    this._state = {
      variantsPresent: false,
      errors: [],
      ...options.initialState || {},
    };
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

  render() {
    loadTemplate('modals/editListing/skuField.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
        errors: this.model.validationError || {},
        max: {
          productIdLength: this.model.max.productIdLength,
        },
      }));
    });

    return this;
  }
}
