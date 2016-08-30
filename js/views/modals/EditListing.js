import $ from 'jquery';
import '../../utils/velocity';
import 'select2';
import _ from 'underscore';
import { MediumEditor } from 'medium-editor';
import { isScrolledIntoView } from '../../utils/dom';
import { getCurrenciesSortedByCode } from '../../data/currencies';
import SimpleMessage from './SimpleMessage';
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
    this.innerListing = this.model.get('listing');

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
      'change #editListingType': 'onChangeListingType',
      'change #editListingSlug': 'onChangeSlug',
      ...super.events(),
    };
  }

  get mode() {
    return this._mode;
  }

  set mode(mode) {
    if (['create', 'edit'].indexOf(mode) === -1) {
      throw new Error('Please specify either a \'create\' or \'edit\' mode.');
    }
  }

  onChangeSlug(e) {
    const val = $(e.target).val();

    // we'll make the slug all lowercase,
    // replace spaces with dashes and remove
    // url unfreindly chars.
    // todo: this could be made into a slugify utility
    $(e.target).val(
      val.toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        // replace consecutive dashes with one
        .replace(/-{2,}/g, '-')
    );
  }

  onChangeListingType(e) {
    if (e.target.value !== 'PHYSICAL_GOOD') {
      this.$conditionWrap.addClass('disabled');
    } else {
      this.$conditionWrap.removeClass('disabled');
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
    const formData = this.getFormData(this.$formFields);

    // todo: show status bar
    this.$saveButton.addClass('disabled');
    this.model.set(formData);

    const images = this.innerListing.get('item').get('images');

    // for now putting in dummy image
    if (!images.length) {
      images.add({
        hash: 'QmecpJrN9RJ7smyYByQdZUy5mF6aapgCfKLKRmDtycv9aG',
        fileName: 'image.jpg',
      });
    }

    const save = this.model.save();

    if (save) {
      console.log('saving to the server');
      save.always(() => this.$saveButton.removeClass('disabled'))
        .fail((...args) => {
          new SimpleMessage({
            // title: app.polyglot.t('settings.errors.saveError'),
            title: 'Error saving listing.',
            // message: args[0] && args[0].responseJSON && args[0].responseJSON.reason || '',
            // temporarily outputing the whole "JSON" string pending the fix of:
            // https://github.com/OpenBazaar/openbazaar-go/issues/102
            message: args[0] && args[0].responseText || '',
          })
          .render()
          .open();
        });
    } else {
      // client side validation failed
      this.$saveButton.removeClass('disabled');

      // temporary for debugging purposes
      console.error('client side validation failed');
      console.error(this.model.validationError);
    }

    // render so errrors are shown / cleared
    this.render();

    const $firstErr = this.$('.errorList:first');

    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
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

  get $conditionWrap() {
    return this._$conditionWrap || this.$('.js-conditionWrap');
  }

  get $saveButton() {
    return this.$_saveButton || this.$('.js-save');
  }

  remove() {
    if (this.descriptionMediumEditor) this.descriptionMediumEditor.destroy();

    super.remove();
  }

  render() {
    this.currencies = this.currencies || getCurrenciesSortedByCode();

    loadTemplate('modals/editListing.html', (t) => {
      this.$el.html(t({
        mode: this.mode,
        localCurrency: app.settings.get('localCurrency'),
        currencies: this.currencies,
        contractTypes: this.innerListing.get('metadata')
          .contractTypes
          .map((contractType) => ({ code: contractType,
            name: app.polyglot.t(`editListing.listingTypes.${contractType}`) })),
        conditionTypes: this.innerListing.get('item')
          .conditionTypes
          .map((conditionType) => ({ code: conditionType,
            name: app.polyglot.t(`editListing.conditionTypes.${conditionType}`) })),
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      super.render();

      this.$('#editListingType, #editListingVisibility, #editListingCondition').select2({
        minimumResultsForSearch: Infinity,
      });

      this.$('#editListingCurrency').select2();

      setTimeout(() => {
        if (this.descriptionMediumEditor) this.descriptionMediumEditor.destroy();
        this.descriptionMediumEditor = new MediumEditor('#editListingDescription', {
          placeholder: {
            text: '',
          },
          toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'unorderedlist', 'orderedlist'],
          },
        });

        if (!this.rendered) {
          this.rendered = true;
          this.$titleInput.focus();
        }
      });

      this._$scrollLinks = null;
      this._$scrollToSections = null;
      this._$formFields = null;
      this._$currencySelect = null;
      this._$priceInput = null;
      this._$conditionWrap = null;
      this.$_saveButton = null;
      this.$titleInput = this.$('#editListingTitle');

      this.$scrollContainer = this.$('.js-scrollContainer');
      this.throttledOnScrollContainer = _.bind(_.throttle(this.onScrollContainer, 100), this);
      this.$scrollContainer.on('scroll', this.throttledOnScrollContainer);
    });

    return this;
  }
}

