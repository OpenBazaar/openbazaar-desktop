import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { recordEvent } from '../../utils/metrics';
import { curConnOnTor } from '../../utils/serverConnect';
import { searchTypes } from '../../utils/search';
import BaseView from '../baseVw';
import { openSimpleMessage } from '../modals/SimpleMessage';
import ProviderMd from '../../models/search/SearchProvider';

export default class extends BaseView {
  constructor(options = {}) {
    if (!searchTypes.includes(options.searchType)) {
      throw new Error('Please provide a valid search type.');
    }

    const opts = {
      searchType: '',
      initialState: {
        showExistsError: false,
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;

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

    /*
       If the exact same path as an existing provider is added, don't save. Note that if a base URL
       is added, like search.ob1.io, it won't be matched to provider URLs, since they include the
       full paths. This is to allow multiple providers on the same domain such as one at
       foo.com/shoeSearch and another at foo.com/hatSearch. This can be a little confusing, due to
       the self-healing mechanism where the endpoint returns search urls and those replace the urls
       the user enters, ie: entering "search.ob1.io" creates a provider that updates to use the
       returned listing endpoint, which is the same as the default OB1 search.
     */
    if (app.searchProviders.getProviderByURL(URL)) {
      this.setState({ showExistsError: true });
      return;
    }

    const opts = {};
    const urlType = `${curConnOnTor() ? 'tor' : ''}${this.options.searchType}`;
    opts[urlType] = URL;

    // pass the type of url to validate to the model
    this.model.set(opts, { validate: true, urlTypes: [urlType] });
    const modelErrors = this.model.validationError && this.model.validationError[urlType];
    if (!modelErrors) {
      const save = this.model.save(opts, { urlTypes: [urlType] });
      if (save) {
        // when saved successfully this view will be removed when the search is rerendered
        save.done(() => {
          recordEvent('Discover_AddProviderSaved', { errors: 'none', url: URL });
          app.searchProviders.add(this.model);
          this.trigger('newProviderSaved', this.model);
        })
          .fail(() => {
          // this is saved to local storage, errors shouldn't normally happen
            openSimpleMessage('This search provider could not be saved.');
          });
      }
    } else {
      recordEvent('Discover_AddProviderSaved', { errors: 'Invalid' });
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
        ...this.getState(),
      }));
    });
    setTimeout(() => {
      this.getCachedEl('.js-addProviderInput').focus();
    });

    return this;
  }
}
