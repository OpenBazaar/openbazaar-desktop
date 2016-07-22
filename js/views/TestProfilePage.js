import $ from 'jquery';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
// import app from '../app';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  events() {
    return {
      'click input[type=submit]': 'onSaveForm',
    };
  }

  className() {
    return 'testProfilePage';
  }

  onSaveForm(e) {
    e.preventDefault();
    this.saveForm();
  }

  saveForm() {
    this.getFormData();
  }

  getFormData() {
    this.$fields = this.$fields || this.$('input[name], textarea[name]');
    this.$fields.each((index, field) => {
      const $field = $(field);
      console.log(`${$field.attr('name')}: ${field.value}`);
    });
  }

  render() {
    loadTemplate('testProfile.html', (t) => {
      this.$el.html(t());
      this.$fields = null;
    });

    return this;
  }
}
