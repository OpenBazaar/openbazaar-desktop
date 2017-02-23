// import $ from 'jquery';
// import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);

    this.listenTo(this.model, 'change', this.render);
  }

  className() {
    return 'chatHead';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick() {
    this.trigger('click', { view: this });
  }

  render() {
    loadTemplate('chat/chatHead.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
