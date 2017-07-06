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

  className() {
    return 'socialAccount flexRow gutterH';
  }

  events() {
    return {
      'click .js-deleteAccount': 'onClickRemove',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  getFormData(fields = this.$formFields) {
    return super.getFormData(fields);
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    this.model.set(this.getFormData());
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('input[name]'));
  }

  render() {
    loadTemplate('modals/settings/socialAccount.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: {
          ...(this.model.validationError || {}),
          ...(this.options.accountErrors || {}),
        },
      }));

      this._$formFields = null;
    });

    return this;
  }
}
