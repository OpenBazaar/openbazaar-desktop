import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model) {
      throw new Error('Please provide a SMTPSettings model.');
    }
  }

  className() {
    return 'box padMdKids padStack clrP clrBr';
  }

  tagName() {
    return 'form';
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    this.model.set(this.getFormData());
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/smtpSettings.html', (t) => {
      this.$el.html(t({
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
