import $ from 'jquery';
import Swiper from 'swiper';
import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import UserCardSwiper from './UserCardSwiper';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.fetchUrl || !(typeof options.fetchUrl === 'string')) {
      throw new Error('Please provide a feature store fetch url.');
    }

    const opts = {
      ...options,
      initialState: {
        loading: false,
        ...options.initialState,
      },
    };

    super(opts);
    this.options = opts;

    this.storeViews = [];
    this.loadStores();
  }

  className() {
    return 'featureStores';
  }

  renderStores(collection = []) {
    const resultsFrag = document.createDocumentFragment();

    collection.forEach(storeID => {
      const view = this.createChild(UserCardSwiper, { guid: storeID });
      this.storeViews.push(view);
      view.render().$el.appendTo(resultsFrag);
    });

    this.getCachedEl('.swiper-wrapper').html(resultsFrag);
  }

  loadStores() {
    this.removeStoreViews();
    this.setState({ loading: true });

    if (this.storesFetch) this.storesFetch.abort();
    this.storesFetch = $.get({
      url: this.options.fetchUrl,
      dataType: 'json',
    })
      .done((data) => (this.featureStoreIDs = data))
      .always(() => (this.setState({ loading: false })));
  }

  removeStoreViews() {
    this.storeViews.forEach(vw => vw.remove());
    this.storeViews = [];
  }

  remove() {
    this.removeStoreViews();
    if (this.storesFetch) this.storesFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('search/featureStores.html', t => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    if (this.featureStoreIDs) this.renderStores(this.featureStoreIDs);

    this._swiper = new Swiper(this.getCachedEl('.swiper-container'), {
      slidesPerView: 3,
      spaceBetween: 10,
      autoplay: true,
    });

    return this;
  }
}
