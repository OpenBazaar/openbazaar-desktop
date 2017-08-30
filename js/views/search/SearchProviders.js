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
    return 'searchProviders flexRow gutterH';
  }

  events() {
    return {
      'click .js-openAddBtn': 'onClickOpenAdd',
    };
  }

  onClickOpenAdd(e) {
    e.stopPropagation();
    this.createAddBox();
  }

  createAddBox() {
    if (this.addProvider) this.addProvider.remove();
    this.addProvider = this.createChild(AddProvider, { ...this.options });
    this.getCachedEl('.js-addWrapper').append(this.addProvider.render().$el);
    this.listenTo(this.addProvider, 'newProviderSaved', (md) => {
      this.trigger('activateProvider', md);
    });
  }

  createProviderView(model, options = {}) {
    const opts = {
      active: this.options.currentID === model.id,
      urlType: this.options.urlType,
      ...options,
    };

    const view = this.createChild(Provider, {
      model,
      ...opts,
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
        peerID: app.profile.get('peerID'),
        showAdd: app.searchProviders.length < app.searchProviders.maxProviders,
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
