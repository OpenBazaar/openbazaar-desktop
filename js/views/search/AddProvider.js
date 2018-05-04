import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import app from '../../app';
import ProviderMd from '../../models/search/SearchProvider';
import { openSimpleMessage } from '../modals/SimpleMessage';
import { recordEvent } from '../../utils/metrics';


export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.model = new ProviderMd();

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'addProvider';
  }

  events() {
    return {
      'click .js-addBtn': 'onClickAdd',
      'click .js-cancelBtn': 'onClickCancel',
      'keyup .js-addProviderInput': 'onKeyUpAddProviderInput',
    };
  }

  onDocumentClick(e) {
    if (!($.contains(this.el, e.target) || e.target === this.el)) {
      this.remove();
    }
  }

  save() {
    let URL = this.getCachedEl('.js-addProviderInput').val();
    // if the user doesn't type http:// or https://, add http:// for them
    if (!/^https?:\/\//i.test(URL)) {
      URL = `http://${URL}`;
    }

    const opts = {};
    const urlType = this.options.urlType;
    opts[urlType] = URL;

    // pass the type of url to validate to the model
    this.model.set(opts, { validate: true, urlTypes: [urlType] });
    const modelErrors = this.model.validationError && this.model.validationError[urlType];
    if (!modelErrors) {
      const save = this.model.save(opts, { urlTypes: [urlType] });
      if (save) {
        // when saved successfully this view will be removed when the search is rerendered
        save.done(() => {
          recordEvent('Discover_AddProviderSaved', { error: 'none' });
          app.searchProviders.add(this.model);
          this.trigger('newProviderSaved', this.model);
        })
          .fail(() => {
          // this is saved to local storage, errors shouldn't normally happen
            openSimpleMessage('This search provider could not be saved.');
          });
      }
    } else {
      recordEvent('Discover_AddProviderSaved', { error: 'Invalid' });
      this.render();
    }
  }

  onKeyUpAddProviderInput(e) {
    if (e.which === 13) {
      this.save();
    }
  }

  onClickAdd(e) {
    e.stopPropagation();
    this.save();
  }

  onClickCancel() {
    this.remove();
    recordEvent('Discover_AddProviderCancel');
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('search/addProvider.html', t => {
      this.$el.html(t({
        errors: {
          ...(this.model.validationError || {}),
        },
        ...this.options,
      }));
    });
    setTimeout(() => {
      this.getCachedEl('.js-addProviderInput').focus();
    });

    return this;
  }
}
