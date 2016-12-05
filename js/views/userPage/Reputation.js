import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return 'userPageReputation';
  }

  events() {
    return {
      // 'click .js-tab': 'tabClick',
    };
  }

  render() {
    loadTemplate('userPage/reputation.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}

