import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import Provider from './SearchProvider';
import app from '../../app';
import AddProvider from './AddProvider';
import { recordEvent } from '../../utils/metrics';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.urlType) {
      throw new Error('An urlType is required.');
    }
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
    recordEvent('Discover_AddProvider');
  }

  createAddBox() {
    if (this.addProvider) this.addProvider.remove();
    this.addProvider = this.createChild(AddProvider, {
      urlType: this.options.urlType,
      usingTor: this.options.usingTor,
    });
    this.getCachedEl('.js-addWrapper').append(this.addProvider.render().$el);
    this.listenTo(this.addProvider, 'newProviderSaved', (md) => {
      this.trigger('activateProvider', md);
    });
  }

  createProviderView(model) {
    const view = this.createChild(Provider, {
      model,
      active: this.options.currentID === model.id,
      selecting: this.options.selecting,
    });

    this.listenTo(view, 'click', (md) => {
      this.trigger('activateProvider', md);
    });

    return view;
  }

  render() {
    super.render();
    loadTemplate('search/providers.html', t => {
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
          if (provider.get(this.options.urlType)) {
            // if the provider is the wrong type, don't add it to the DOM
            view.render().$el.appendTo(providerFrag);
          }
        }
      });

      this.getCachedEl('.js-providerWrapper').prepend(providerFrag);
    });

    return this;
  }
}
