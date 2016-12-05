import loadTemplate from '../utils/loadTemplate';
import { capitalize } from '../utils/string';
import baseVw from './baseVw';

export default class extends baseVw {
  className() {
    return 'statusMessageWrap';
  }

  constructor(options) {
    super(options);
    this.listenTo(this.model, 'change', this.render);
  }

  events() {
    return {
      'click [class^="js-"], [class*=" js-"]': 'onClick',
    };
  }

  onClick(e) {
    // If the the el has a '.js-<class>' class, we'll trigger a
    // 'click<Class>' event from this view.
    const events = [];

    e.currentTarget.classList.forEach((className) => {
      if (className.startsWith('js-')) events.push(className.slice(3));
    });

    if (events.length) {
      events.forEach(event => {
        this.trigger(`click${capitalize(event)}`, { view: this, e });
      });
    }
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
