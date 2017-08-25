import $ from 'jquery';
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
    this.rendered = false;

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
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

  onDocumentClick(e) {
    if (this.rendered && !($.contains(this.el, e.target) || e.target === this.el)) {
      this.remove();
    }
  }

  save() {
    // set rendered to false so the re-render doesn't allow onDocumentClick to close the view
    this.rendered = false;
    const URL = this.getCachedEl('.js-addProviderInput').val();
    const opts = {};
    // if the user is using Tor, we will assume this is a Tor url
    if (this.options.usingTor) {
      opts.torlistings = URL;
    } else {
      opts.listings = URL;
    }
    this.model.set(opts, { validate: true });
    if (!this.model.validationError) {
      const save = this.model.save();
      if (save) {
        // when saved successfully the parent will be removed when the search is rerendered
        save.done(() => app.searchProviders.add(this.model))
          .fail(() => {
          // this is saved to local storage, errors shouldn't normally happen
            openSimpleMessage('This search provider could not be saved.');
          });
      }
    } else {
      this.render();
    }
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

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
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
    // add a timeout so click that opens the view doesn't close it via onDocumentClick
    setTimeout(() => {
      this.rendered = 'true';
    });

    return this;
  }
}
