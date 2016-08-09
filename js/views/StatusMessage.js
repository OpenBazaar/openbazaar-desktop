import loadTemplate from '../utils/loadTemplate';
import BaseVw from './baseVw';

export default class extends BaseVw {
  className() {
    return 'statusMessageWrap';
  }

  constructor() {
    this.super();
    this.listenTo(this.model, 'change', this.render);
  }

  render() {
    loadTemplate('./js/templates/statusMessage.html', (tmpl) => {
      this.$el.html(
        tmpl(this.model.toJSON())
      );
    });

    return this;
  }
}
