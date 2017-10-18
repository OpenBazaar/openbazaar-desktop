import $ from 'jquery';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a VariantOption model.');
    }

    // any parent level errors can be passed in options.errors, e.g.
    // options.errors = {
    //   <field-name>: ['err1', 'err2', 'err3']
    // }

    super(options);
    this.options = options;

    console.log('i am variant mooEl');
    window.variant = this.model;
    window.mooEl = this.$el;
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
    const formData = super.getFormData(fields);

    // We'll manually parse the variants select since we need to
    // make sure to maintain the clientID.
    const variants = [];
    this.$('select[name=variants] option')
      .each((index, opt) => {
        variants.push({
          name: opt.textContent,
          _clientID: opt.getAttribute('data-clientID'),
        });
      });

    return {
      ...formData,
      variants,
    };
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();
    console.log('data');
    window.data = formData;
    this.model.set(formData);
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('input[name], textarea[name]'));
  }

  render() {
    super.render();
    const errors = {
      ...(this.model.validationError || {}),
      ...(this.options.errors || {}),
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

      this.$variantChoicesSelect.select2({
        multiple: true,
        tags: true,
        selectOnClose: true,
        tokenSeparators: [','],
        // dropdownParent needed to fully hide dropdown
        dropdownParent: this.$('.js-dropDownContainer'),
        matcher: () => false, // this is necessary
        maximumSelectionLength: this.model.max.variantCount,
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
