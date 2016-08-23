import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';

export default class extends baseVw {
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
