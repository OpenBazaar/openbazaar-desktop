import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import Provider from './SearchProvider';
import app from '../../app';
import AddProvider from './AddProvider';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.providerViews = [];

    this.listenTo(app.searchProviders, 'add', (md) => {
      const view = this.createProviderView(md);
      if (view) {
        this.providerViews.push(view);
        this.render();
      }
    });

    this.listenTo(app.searchProviders, 'remove', (md, cl, removeOpts) => {
      this.providerViews.splice(removeOpts.index, 1)[0].remove();
      this.render();
    });
  }

  className() {
    return 'searchProviders flexVCent gutterH';
  }

  events() {
    return {
      'click .js-openAddBtn': 'onClickOpenAdd',
    };
  }

  onClickOpenAdd() {
    this.createAddBox();
  }

  createAddBox() {
    if (this.addProvider) this.addProvider.remove();
    this.addProvider = this.createChild(AddProvider, { ...this.options });
    this.getCachedEl('.js-addWrapper').append(this.addProvider.render().$el);
    this.addProvider.getCachedEl('.js-addProviderInput').focus();
  }

  createProviderView(model, options = {}) {
    // when in Tor mode, do not show providers that don't have Tor URLs and vice versa.
    if (this.options.usingTor && !model.get('torlistings')) {
      return false;
    } else if (!this.options.usingTor && !model.get('listings')) {
      return false;
    }

    const view = this.createChild(Provider, {
      model,
      ...options,
    });

    this.listenTo(view, 'click', (md) => {
      this.trigger('activateProvider', md);
    });

    return view;
  }

  render() {
    super.render();
    loadTemplate('search/Providers.html', t => {
      this.$el.html(t({
        ...this.options,
      }));

      this.providerViews.forEach(provider => provider.remove());
      this.providerViews = [];

      const providerFrag = document.createDocumentFragment();

      app.searchProviders.forEach(provider => {
        const view = this.createProviderView(provider);
        if (view) {
          this.providerViews.push(view);
          view.render().$el.appendTo(providerFrag);
        }
      });

      this.getCachedEl('.js-providerWrapper').prepend(providerFrag);
    });

    return this;
  }
}
