import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries } from '../../../data/countries';
import app from '../../../app';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      listPosition: 1,
      ...options,
    };

    super(opts);
    this.options = opts;

    // Since multiple instances of this view will be rendered, the 'viewId' is a unique id that
    // will prefaced to any id's in the template so they'll be unique.
    this.viewId = _.uniqueId();
    this.select2CountryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));
  }

  set listPosition(position) {
    if (typeof position !== 'number') {
      throw new Error('Please provide a position as a number');
    }

    const prevPosition = this.options.listPosition;
    const listPosition = this.options.listPosition = position;

    if (listPosition !== prevPosition) {
      this.$headline.text(
        app.polyglot.t('editListing.shippingOptions.optionHeading', { listPosition })
      );
    }
  }

  get listPosition() {
    return this.options.listPosition;
  }

  tagName() {
    return 'section';
  }

  // className() {
  //   return `${super.className()} editListing tabbedModal modalTop`;
  // }

  // events() {
  //   return {
  //     'click .js-scrollLink': 'onScrollLinkClick',
  //     ...super.events(),
  //   };
  // }

  get $headline() {
    return this._$headline || this.$('h1');
  }

  get $shipDestinationDropdown() {
    return this._$shipDestinationDropdown || this.$(`#shipDestinationsDropdown_${this.viewId}`);
  }

  render() {
    this.model.unset('regions');
    console.log('moo');
    window.moo = this.model;

    loadTemplate('modals/editListing/shippingOption.html', t => {
      this.$el.html(t({
        viewId: this.viewId,
        listPosition: this.options.listPosition,
        countryList: getTranslatedCountries(app.settings.get('language')),
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this.$shipDestinationSelect = this.$(`#shipDestinationsSelect_${this.viewId}`);
      this.$shipDestinationsPlaceholder = this.$(`#shipDestinationsPlaceholder_${this.viewId}`);

      this.$shipDestinationSelect.select2({
        multiple: true,
        // even though this is a tagging field, since we are limiting the possible selections
        // to a list of countries, don't use tag: true, because then it will allows you to
        // add tags not in the list
        // tags: true,
        dropdownParent: this.$(`#shipDestinationsDropdown_${this.viewId}`),
        data: this.select2CountryData,
      }).on('change', () => {
        const regions = this.$shipDestinationSelect.val();
        this.model.set('regions', regions);
        this.$shipDestinationsPlaceholder[
          regions.length ? 'removeClass' : 'addClass'
        ]('emptyOfTags');
      });

      this.$shipDestinationsPlaceholder[
        this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
      ]('emptyOfTags');

      this._$headline = null;
      this._$shipDestinationDropdown = null;
    });

    return this;
  }
}
