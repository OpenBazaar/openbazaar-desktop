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
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP',
      ...options,
    };

    super(opts);
    this.options = opts;

    // So the passed in modal does not get any un-saved data,
    // we'll clone and update it on sync
    this._origModel = this.model;
    this.model = this._origModel.clone();
    this.listenTo(this.model, 'sync', () => {
      if (this.createMode && this.model.lastSyncedAttrs.listing &&
        this.model.lastSyncedAttrs.listing.slug) {
        this.createMode = false;
        this.$('.js-listingHeading').text(app.polyglot.t('editListing.editListingLabel'));
      }

      if (!_.isEqual(this.model.toJSON(), this._origModel.toJSON())) {
        this._origModel.set(this.model.toJSON(), { silent: true });

        // A change events won't fire on a parent model if a nested model change.
        // The nested models would need to have change events manually bound to them
        // which is cumbersome with a model like this with so many levels of nesting.
        // So, for now, we'll manually fire a change event if anything has changed.
        // TODO: Find a reasonable way to manage something like this and
        // put it in the baseModel.
        this._origModel.trigger('change', this._origModel);
      }
    });

    this.innerListing = this.model.get('listing');
    this.selectedNavTabIndex = 0;

    this.createMode = !(this.model.lastSyncedAttrs.listing &&
      this.model.lastSyncedAttrs.listing.slug);
  }

  className() {
    return `${super.className()} editListing tabbedModal modalTop`;
  }

  events() {
    return {
      'click .js-scrollLink': 'onScrollLinkClick',
      'click .js-save': 'onSaveClick',
      'change #editListingType': 'onChangeListingType',
      'change #editListingSlug': 'onChangeSlug',
      'change .js-price': 'onChangePrice',
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

  onChangePrice(e) {
    let updatedVal = $(e.target).val().trim();
    const valAsNumber = Number(updatedVal);

    if (!isNaN(valAsNumber)) {
      updatedVal = valAsNumber.toFixed(2);
    }

    $(e.target).val(updatedVal);
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
    const index = $(e.target).index();
    this.selectedNavTabIndex = index;
    this.$scrollLinks.removeClass('active');
    $(e.target).addClass('active');
    this.$scrollContainer.off('scroll', this.throttledOnScrollContainer);

    this.$scrollToSections.eq(index)
      .velocity('scroll', {
        container: this.$scrollContainer,
        complete: () => this.$scrollContainer.on('scroll', this.throttledOnScrollContainer),
      });
  }

  onScrollContainer() {
    let index = 0;
    let keepLooping = true;

    while (keepLooping) {
      if (isScrolledIntoView(this.$scrollToSections[index])) {
        this.$scrollLinks.removeClass('active');
        this.$scrollLinks.eq(index).addClass('active');
        this.selectedNavTabIndex = index;
        keepLooping = false;
      } else {
        index += 1;
      }
    }
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
      save.always(() => this.$saveButton.removeClass('disabled'))
        .fail((...args) => {
          new SimpleMessage({
            title: app.polyglot.t('editListing.saveErrorTitle'),
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

  render(restoreScrollPos = true) {
    let prevScrollPos = 0;

    if (restoreScrollPos && this.$scrollContainer && this.$scrollContainer.length) {
      prevScrollPos = this.$scrollContainer[0].scrollTop;
    }

    this.currencies = this.currencies || getCurrenciesSortedByCode();

    loadTemplate('modals/editListing.html', (t) => {
      this.$el.html(t({
        createMode: this.createMode,
        selectedNavTabIndex: this.selectedNavTabIndex,
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

      this.$scrollContainer = this.$('.js-scrollContainer');

      // restore the scroll position
      if (restoreScrollPos) {
        this.$scrollContainer[0].scrollTop = prevScrollPos;
      }

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

      this.throttledOnScrollContainer = _.bind(_.throttle(this.onScrollContainer, 100), this);
      this.$scrollContainer.on('scroll', this.throttledOnScrollContainer);
    });

    return this;
  }
}

