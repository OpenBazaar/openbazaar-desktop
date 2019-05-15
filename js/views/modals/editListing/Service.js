import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);
    this.options = options;
  }

  events() {
    return {
      'click .js-btnRemoveService': 'onClickRemoveService',
    };
  }

  get className() {
    return 'flexRow gutterH';
  }

  onClickRemoveService() {
    this.trigger('click-remove', { view: this });
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    this.model.set(this.getFormData(this.$formFields));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

  render() {
    loadTemplate('modals/editListing/service.html', t => {
      this.$el.html(t({
        // Since multiple instances of this view will be rendered, any id's should
        // include the cid, so they're unique.
        cid: this.model.cid,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this._$formFields = null;
    });

    return this;
  }
}
