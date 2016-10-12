import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries, getCountryByDataName } from '../../../data/countries';
import app from '../../../app';
import Service from './Service';
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
    this.select2CountryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));
    this.servicesViews = [];
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

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  get $headline() {
    return this._$headline || this.$('h1');
  }

  get $shipDestinationDropdown() {
    return this._$shipDestinationDropdown || this.$(`#shipDestinationsDropdown_${this.model.cid}`);
  }

  get $formFields() {
    return this._$formFields ||
      this.$('select[name], input[name], textarea[name]');
  }

  render() {
    loadTemplate('modals/editListing/shippingOption.html', t => {
      this.$el.html(t({
        // Since multiple instances of this view will be rendered, any id's should
        // include the cid, so they're unique.
        cid: this.model.cid,
        listPosition: this.options.listPosition,
        shippingTypes: this.model.shippingTypes,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
        regions: this.model.get('regions').map(region => {
          const countryData = getCountryByDataName(region);

          return {
            text: countryData.name,
            value: region,
          };
        }),
      }));

      this.$(`#shipOptionType_${this.model.cid}`).select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });

      this.$shipDestinationSelect = this.$(`#shipDestinationsSelect_${this.model.cid}`);
      this.$shipDestinationsPlaceholder = this.$(`#shipDestinationsPlaceholder_${this.model.cid}`);
      this.$servicesWrap = this.$('.js-servicesWrap');

      this.$shipDestinationSelect.select2({
        multiple: true,
        // even though this is a tagging field, since we are limiting the possible selections
        // to a list of countries, don't use tag: true, because then it will allows you to
        // add tags not in the list
        // tags: true,
        dropdownParent: this.$(`#shipDestinationsDropdown_${this.model.cid}`),
        data: this.select2CountryData,
      }).on('change', () => {
        this.$shipDestinationsPlaceholder[
          this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
        ]('emptyOfTags');
      });

      this.$shipDestinationsPlaceholder[
        this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
      ]('emptyOfTags');

      this.servicesViews.forEach((serviceVw) => serviceVw.remove());
      this.serviceViews = [];
      this.model.get('services').forEach((serviceMd) => {
        const serviceVw = this.createChild(Service, { model: serviceMd });

        this.serviceViews.push(serviceVw);
        this.$servicesWrap.html(serviceVw.render().el);
      });

      this._$headline = null;
      this._$shipDestinationDropdown = null;
      this._$formFields = null;
    });

    return this;
  }
}
