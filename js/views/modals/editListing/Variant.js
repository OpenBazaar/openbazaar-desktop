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

    // Post process the vairants to seperate the clientID from the actual value.
    formData.variants = formData.variants.map(v => {
      if (v.includes('<===>')) {
        const split = v.split('<===>');
        return {
          _clientID: split[0],
          name: split[1],
        };
      }

      return { name: v };
    });

    return formData;
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

      this._$formFields = null;

      const variantItems = [];
      const variantOptions = [];

      this.model.get('variants').toJSON()
        .forEach(variant => {
          const value = `${variant._clientID}<===>${variant.name}`;
          variantOptions.push({ ...variant, value });
          variantItems.push(value);
        });

      this.getCachedEl('select[name=variants]').selectize({
        persist: false,
        valueField: 'value',
        options: variantOptions,
        items: variantItems,
        create: input => ({
          name: input,
          value: input,
        }),
        render: {
          option: data => `<div>${data.name}</div>`,
          item: data => `<div>${data.name}</div>`,
        },
      }).on('change', () => this.trigger('choiceChange', { view: this }));
    });

    return this;
  }
}
