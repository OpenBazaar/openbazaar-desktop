import loadTemplate from '../utils/loadTemplate';
import BaseVw from './BaseVw';

export default class extends BaseVw {
  className() {
    return 'statusMessageWrap';
  }

  constructor(options) {
    super(options);
    this.listenTo(this.model, 'change', this.render);
  }

  render() {
    loadTemplate('./statusMessage.html', (tmpl) => {
      this.$el.html(
        tmpl(this.model.toJSON())
      );
    });

    return this;
  }
}
