import BaseVw from '../baseVw';
import userShort from '../userShort';

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
    this.$el.empty();
    if (this.followArray.length) {
      this.followArray.forEach((follow) => {
        console.log(follow);
        const user = this.createChild(userShort, {
          model: follow,
        });
        this.$el.append(user.render().$el);
      });
    } else {
      console.log('none found');
    }
    this.$el.append('foo test');
    return this;
  }
}

