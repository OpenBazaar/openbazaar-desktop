// This is a view that will do nothing more than render
// a template that it's given when contructed, passing along
// any context passed into render as context for the template.
//
// If you need something beyond that, this view is probably not for you.
import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!options.template) {
      throw new Error('Please provide a template');
    }

    this.options = options;
  }

  render(context = {}) {
    loadTemplate(this.options.template, (t) => {
      this.$el.html(t(context));
    });

    return this;
  }
}
