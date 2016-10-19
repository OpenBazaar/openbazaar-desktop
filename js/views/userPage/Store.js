import loadTemplate from '../../utils/loadTemplate';
import Listings from '../../collections/Listings';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      className: 'userPageStore',
      events: {
      },
      ...options,
    });

    this.collection = new Listings();
    this.colFetch = this.collection.fetch()
      .always(() => this.render());
  }

  get tabClass() {
    return 'store';
  }

  render() {
    loadTemplate('userPage/userPageStore.html', (t) => {
      this.$el.html(t({
        listings: this.collection.toJSON(),
        isFetching: this.colFetch.state() === 'pending',
      }));
    });

    return this;
  }
}
