
import BaseView from '../baseVw';
import UserCard from '../UserCard';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.guid || !(typeof options.guid === 'string')) {
      throw new Error('Please provide a guid.');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'swiper-slide';
  }

  render() {
    super.render();
    const view = new UserCard({ guid: this.options.guid });
    this.$el.append(view.render().el);
    return this;
  }
}
