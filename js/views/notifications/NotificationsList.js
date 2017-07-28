import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    // const opts = {
    //   ...options,
    // };

    super(options);

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.options = options;
    this.listenTo(this.collection, 'request', this.onRequest);
    this.collection.fetch();
  }

  // get tagName() {
  //   return 'section';
  // }

  className() {
    return 'notificationsList navList listBox clrBr';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  // onRequest(cl, xhr, opts) {
  onRequest(cl, xhr, opts) {

  }

  // remove() {
  //   super.remove();
  // }

  render() {
    super.render();

    loadTemplate('notificationsList.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}
