import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);
  }

  className() {
    return 'socialAccount';
  }

  events() {
    return {
      'click .js-deleteAccount': 'onClickRemove',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  getFormData(fields = this.getCachedEl('input[name]')) {
    return super.getFormData(fields);
  }

  get firstBlankField() {
    const formData = this.getFormData();
    return _.findKey(formData, val => !val);
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    this.model.set(this.getFormData());
  }

  render() {
    super.render();
    loadTemplate('modals/settings/socialAccount.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
      }));
    });
    return this;
  }
}
