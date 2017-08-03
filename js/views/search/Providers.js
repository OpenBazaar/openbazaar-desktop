import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import Provider from './Provider';
import ProviderMd from '../../models/search/SearchProvider';
import app from '../../app';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.providerViews = [];

    this.listenTo(app.searchProviders, 'add', (md) => {
      const view = this.createProviderView(md);
      this.providerViews.push(view);
      this.getCachedEl('.js-providerWrapper').append(view.render().el);
    });

    this.listenTo(app.searchProviders, 'remove', (md, cl, removeOpts) => {
      this.providerViews.splice(removeOpts.index, 1)[0].remove();
    });
  }

  className() {
    return 'searchProviders flexVCent gutterH';
  }

  events() {
    return {
      'click .js-addProvider': 'onClickAddProvider',
    };
  }

  get lastIndex() {
    return app.searchProviders.length ? app.searchProviders.length - 1 : 0;
  }

  addBlankProvider() {
    app.searchProviders.add(new ProviderMd());
  }

  onClickAddProvider() {
    this.addBlankProvider();
  }

  createProviderView(model, options = {}) {
    const view = this.createChild(Provider, {
      model,
      ...options,
    });

    this.listenTo(view, 'click', (opts) => {
      this.trigger('activateProvider', opts);
    });

    return view;
  }

  removeProvider(id) {
    if (!id) {
      throw new Error('Please provide an id to remove.');
    }
    app.searchProviders.remove(id);
  }

  render() {
    super.render();
    loadTemplate('search/Providers.html', t => {
      this.$el.html(t({
        peerID: app.profile.get('peerID'),
      }));

      this.providerViews.forEach(provider => provider.remove());
      this.providerViews = [];

      const providerFrag = document.createDocumentFragment();

      app.searchProviders.forEach(provider => {
        const view = this.createProviderView(provider);
        this.providerViews.push(view);
        view.render().$el.appendTo(providerFrag);
      });

      this.getCachedEl('.js-providerWrapper').prepend(providerFrag);
    });

    return this;
  }
}
