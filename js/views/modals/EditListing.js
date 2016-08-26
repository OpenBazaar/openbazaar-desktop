import $ from 'jquery';
import '../../utils/velocity';
import 'select2';
import _ from 'underscore';
import { isScrolledIntoView } from '../../utils/dom';
import { getCurrenciesSortedByCode, getCurrencyByCode } from '../../data/currencies';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
// import SimpleMessage from '../SimpleMessage';
// import Dialog from '../Dialog';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP border clrBr',
      // removeOnRoute: false,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.mode = options.mode || 'create';

    // this.listenTo(app.router, 'will-route', () => {
    //   this.close(true);
    //   this.remove();
    // });
  }

  className() {
    return `${super.className()} editListing tabbedModal`;
  }

  events() {
    return {
      'click .js-scrollLink': 'onScrollLinkClick',
      'click .js-save': 'onSaveClick',
      'change #editListingCurrency': 'onChangeCurrency',
      'change #editListingPrice': 'onChangePrice',
      ...super.events(),
    };
  }

  onChangeCurrency() {
    this.localizePrice();
  }

  onChangePrice() {
    this.localizePrice();
  }

  localizePrice() {
    const price = parseFloat(this.$priceInput.val().replace(/[^\d.-]/g, ''));

    if (isNaN(price)) return;

    const currency = this.$currencySelect.val();

    let localizedPrice = price.toLocaleString(app.settings.get('language'),
        { style: 'currency', currency });

    localizedPrice = localizedPrice.replace(currency, getCurrencyByCode(currency).symbol);

    /* eslint no-irregular-whitespace: ["error", { "skipComments": true }] */
    // Please note, the price number format will be localized based on the users
    // language setting. For example, 123.45 with a currency code of PLN, will show
    // up as zł123.45 if your language is en-US, whereas if your language is
    // pl, it will show up as 12 345,00 zł. // eslint-disable-line no-irregular-whitespace

    this.$priceInput.val(localizedPrice);
  }

  get mode() {
    return this._mode;
  }

  set mode(mode) {
    if (['create', 'edit'].indexOf(mode) === -1) {
      throw new Error('Please specify either a \'create\' or \'edit\' mode.');
    }
  }

  onScrollLinkClick(e) {
    this.$scrollLinks.removeClass('active');
    $(e.target).addClass('active');
    this.$scrollContainer.off('scroll', this.throttledOnScrollContainer);

    this.$scrollToSections.eq($(e.target).index())
      .velocity('scroll', {
        container: this.$scrollContainer,
        complete: () => this.$scrollContainer.on('scroll', this.throttledOnScrollContainer),
      });
  }

  onSaveClick() {
    const moo = this.getFormData(this.$formFields);

    // temporary approach
    this.model.set(moo, { validate: true });
    this.render();
  }

  onScrollContainer() {
    let index = 0;
    let keepLooping = true;

    while (keepLooping) {
      if (isScrolledIntoView(this.$scrollToSections[index])) {
        this.$scrollLinks.removeClass('active');
        this.$scrollLinks.eq(index).addClass('active');
        keepLooping = false;
      } else {
        index += 1;
      }
    }
  }

  // get $saveStatus() {
  //   return this._$saveStatus || this.$('.saveStatus');
  // }

  get $scrollToSections() {
    return this._$scrollToSections || this.$('.js-scrollToSection');
  }

  get $scrollLinks() {
    return this._$scrollLinks || this.$('.js-scrollLink');
  }

  get $formFields() {
    return this._$formFields || this.$('select[name], input[name], textarea[name]');
  }

  get $currencySelect() {
    return this._$currencySelect || this.$('#editListingCurrency');
  }

  get $priceInput() {
    return this._$priceInput || this.$('#editListingPrice');
  }

  render() {
    this.currencies = this.currencies || getCurrenciesSortedByCode();

    loadTemplate('modals/editListing.html', (t) => {
      this.$el.html(t({
        localCurrency: app.settings.get('localCurrency'),
        currencies: this.currencies,
        mode: this.mode,
        contractTypes: this.model.get('metadata').contractTypes,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      super.render();

      this.$('#editListingType, #editListingVisibility').select2({
        minimumResultsForSearch: Infinity,
      });

      this.$('#editListingCurrency').select2();

      this._$scrollLinks = null;
      this._$scrollToSections = null;
      this._$formFields = null;
      this._$currencySelect = null;
      this._$priceInput = null;

      this.$scrollContainer = this.$('.js-scrollContainer');
      this.throttledOnScrollContainer = _.bind(_.throttle(this.onScrollContainer, 100), this);
      this.$scrollContainer.on('scroll', this.throttledOnScrollContainer);
    });

    return this;
  }
}

