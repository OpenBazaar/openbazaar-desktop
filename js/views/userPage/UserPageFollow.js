import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.followType = options.followType;
    this.followArray = options.followArray;
  }

  className() {
    return 'userPageFollow';
  }

  events() {
    return {
      // 'click .js-tab': 'tabClick',
    };
  }

  render() {
    loadTemplate('userPage/userPageFollow.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}

