import openSimpleMessage from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }
  }

  className() {
    return 'newConfiguration';
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-save': 'onSaveClick',
    };
  }

  onCancelClick() {
    this.trigger('cancel', { view: this });
  }

  onSaveClick() {
    const save = this.model.save(this.getFormData(this.$formFields));

    if (save) {
      save.done(() => this.trigger('saved', { view: this }))
        .fail(() => {
          // since we're saving to localStorage this really shouldn't happen
          openSimpleMessage('Unable to save server configuration');
        });
    } else {
      console.log('client side failed');
      window.client = this.model;
    }

    this.render();
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$('select[name], input[name], textarea[name]'));
  }

  render() {
    loadTemplate('modals/connectionManagement/configurationForm.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
      }));

      this._$formFields = null;

      if (!this.rendered) {
        this.rendered = true;
        setTimeout(() => this.$('.js-inputName').focus());
      }
    });

    return this;
  }
}
