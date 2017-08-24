import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import app from '../../app';
import ProviderMd from '../../models/search/SearchProvider';
import { openSimpleMessage } from '../modals/SimpleMessage';


export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.model = new ProviderMd();
  }

  className() {
    return 'posR addProvider';
  }

  events() {
    return {
      'click .js-addBtn': 'onClickAdd',
      'click .js-cancelBtn': 'onClickCancel',
      'keyup .js-addProviderInput': 'onKeyUpAddProviderInput',
    };
  }

  save() {
    const URL = this.getCachedEl('.js-addProviderInput').val();
    const opts = {};
    // if the user is using Tor, we will assume this is a Tor url
    if (this.options.usingTor) {
      opts.torListingsUrl = URL;
    } else {
      opts.listingsUrl = URL;
    }
    this.model.set(opts, { validate: true });
    if (!this.model.validationError) {
      const save = this.model.save();
      if (save) {
        save.done(() => app.searchProviders.add(this.model))
          .fail(() => {
          // this is saved to local storage, errors shouldn't normally happen
            openSimpleMessage('This search provider could not be saved.');
          });
      }
    }
    this.render();
  }

  onKeyUpAddProviderInput(e) {
    if (e.which === 13) {
      this.save();
    }
  }

  onClickAdd() {
    this.save();
  }

  onClickCancel() {
    this.remove();
  }

  render() {
    super.render();


    loadTemplate('search/AddProvider.html', t => {
      this.$el.html(t({
        errors: {
          ...(this.model.validationError || {}),
        },
        ...this.options,
      }));
    });

    return this;
  }
}
