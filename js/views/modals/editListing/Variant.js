import $ from 'jquery';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a VariantOption model.');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'variant flexRow gutterH';
  }

  events() {
    return {
      'click .js-btnRemoveVariant': 'onClickRemove',
    };
  }

  onClickRemove() {
    this.trigger('removeClick', { view: this });
  }

  getFormData(fields = this.$formFields) {
    return super.getFormData(fields);
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();
    this.model.set(formData);
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

  render() {
    const errors = {
      ...(this.model.validationError || {}),
      // ...(this.options.optionErrors || {}),
    };

    this.$el.toggleClass('hasError', !!Object.keys(errors).length);

    loadTemplate('modals/editListing/variant.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        max: this.model.max,
        errors,
      }));

      this.$variantChoicesPlaceholder = this.$('.js-variantChoicesPlaceholder');
      this.$variantChoicesSelect = this.$('select[name=variants]');
      this._$formFields = null;

      // TODO: add name qualifier
      this.$variantChoicesSelect.select2({
        multiple: true,
        tags: true,
        // dropdownParent needed to fully hide dropdown
        dropdownParent: this.$('.js-dropDownContainer'),
        matcher: () => false, // this is necessary
      }).on('change', (e) => {
        const count = $(e.target).val().length;

        this.$variantChoicesPlaceholder[
          count ? 'removeClass' : 'addClass'
        ]('emptyOfTags');

        this.trigger('choiceChange', {
          view: this,
          originalEvent: e,
        });
      });

      this.$variantChoicesPlaceholder[
        this.$variantChoicesSelect.val().length ? 'removeClass' : 'addClass'
      ]('emptyOfTags');
    });

    return this;
  }
}
