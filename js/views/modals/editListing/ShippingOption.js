import $ from 'jquery';
import '../../../lib/select2';
import '../../../utils/lib/selectize';
import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries } from '../../../data/countries';
import regions, {
  getTranslatedRegions,
  getIndexedRegions,
} from '../../../data/regions';
import ServiceMd from '../../../models/listing/Service';
import app from '../../../app';
import Service from './Service';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (typeof options.getCurrency !== 'function') {
      throw new Error('Please provide a function for me to obtain the current currency.');
    }

    const opts = {
      listPosition: 1,
      ...options,
    };

    super(opts);
    this.options = opts;

    // get regions
    this.selectCountryData = getTranslatedRegions()
      .map(regionObj => ({
        id: regionObj.id,
        text: regionObj.name,
        isRegion: true,
      }));

    // now, we'll add in the countries
    const selectCountries = getTranslatedCountries()
      .map(countryObj => ({
        id: countryObj.dataName,
        text: countryObj.name,
        isRegion: false,
      }));
    this.selectCountryData = this.selectCountryData.concat(selectCountries);

    this.services = this.model.get('services');
    this.serviceViews = [];

    this.listenTo(this.services, 'add', (serviceMd) => {
      const serviceVw = this.createServiceView({
        model: serviceMd,
      });

      this.serviceViews.push(serviceVw);
      this.$servicesWrap.append(serviceVw.render().el);
    });

    this.listenTo(this.services, 'remove', (serviceMd, servicesCl, removeOpts) => {
      const [splicedVw] = this.serviceViews.splice(removeOpts.index, 1);
      splicedVw.remove();
    });
  }

  events() {
    const events = {
      'click .js-removeShippingOption': 'onClickRemoveShippingOption',
      'click .js-btnAddService': 'onClickAddService',
      'click .js-clearAllShipDest': 'onClickClearShipDest',
    };

    events[`change #shipOptionType_${this.model.cid}`] = 'onChangeShippingType';

    return events;
  }

  tagName() {
    return 'section';
  }

  onClickRemoveShippingOption() {
    this.trigger('click-remove', { view: this });
  }

  onClickAddService() {
    this.services
      .push(new ServiceMd());
  }

  onClickClearShipDest() {
    this.$shipDestinationSelect[0]
      .selectize
      .clear();
  }

  onChangeShippingType(e) {
    let method;

    if ($(e.target).val() === 'LOCAL_PICKUP') {
      method = 'addClass';
    } else {
      method = 'removeClass';

      const services = this.model.get('services');

      if (!services.length) services.push(new ServiceMd());
    }

    this.$serviceSection[method]('hide');
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

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);
    const indexedRegions = getIndexedRegions();

    // Strip out any region elements from shipping destinations
    // drop down. The individual countries will remain.
    formData.regions = formData.regions
      .filter(region => !indexedRegions[region]);

    return formData;
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    // set the data for our nested Services views
    this.serviceViews.forEach((serviceVw) => serviceVw.setModelData());
    this.model.set(this.getFormData());
  }

  createServiceView(opts) {
    const options = {
      getCurrency: this.options.getCurrency,
      ...opts || {},
    };

    const view = this.createChild(Service, options);

    this.listenTo(view, 'click-remove', e => {
      this.services.remove(
        this.services.at(this.serviceViews.indexOf(e.view)));
    });

    return view;
  }

  get $headline() {
    return this._$headline ||
      (this._$headline = this.$('h1'));
  }

  get $shipDestinationDropdown() {
    return this._$shipDestinationDropdown ||
      (this._$shipDestinationDropdown =
        this.$(`#shipDestinationsDropdown_${this.model.cid}`));
  }

  get $serviceSection() {
    return this._$serviceSection ||
      (this._$serviceSection = this.$('.js-serviceSection'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]').filter((index, el) => (
          !$(el).parents('.js-serviceSection').length)));
  }

  /**
   * Returns a list of any regions that are fully represented in the provided
   * countries list.
   */
  representedRegions(countries = []) {
    if (!Array.isArray(countries)) {
      throw new Error('Please provide an array of country codes.');
    }

    const selectedRegions = [];

    regions.forEach(region => {
      if (region.countries.every(elem => countries.indexOf(elem) > -1)) {
        selectedRegions.push(region.id);
      }
    });

    return selectedRegions;
  }

  render() {
    super.render();
    loadTemplate('modals/editListing/shippingOption.html', t => {
      this.$el.html(t({
        // Since multiple instances of this view will be rendered, any id's should
        // include the cid, so they're unique.
        cid: this.model.cid,
        listPosition: this.options.listPosition,
        shippingTypes: this.model.shippingTypes,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this.$(`#shipOptionType_${this.model.cid}`).select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });

      this.$shipDestinationSelect = this.getCachedEl(`#shipDestinationsSelect_${this.model.cid}`);
      this.$servicesWrap = this.$('.js-servicesWrap');

      this.$shipDestinationSelect.selectize({
        maxItems: null,
        valueField: 'id',
        searchField: ['text', 'id'],
        items: this.model.get('regions'),
        options: this.selectCountryData,
        render: {
          option: data => {
            const className = data.isRegion ? 'region' : '';
            return `<div class="${className}">${data.text}</div>`;
          },
          item: data => {
            const className = data.isRegion ? 'region' : '';
            return `<div class="${className}">${data.text}</div>`;
          },
        },
        onItemAdd: value => {
          const region = getIndexedRegions()[value];
          const selectize = this.$shipDestinationSelect[0].selectize;

          if (region) {
            // If adding a region, we'll add in all the countries for that region.
            // selectize.removeItem(value);
            selectize.addItems(region.countries, true);
          } else {
            // Adding a country may cause a region or regions to be represented.
            // We'll add in any full regions so they're not selectable as options.
            // CSS will hide the tag.
            selectize.addItems(this.representedRegions(selectize.items), true);
          }
        },
        onItemRemove: value => {
          const isRegion = !!getIndexedRegions()[value];
          const selectize = this.$shipDestinationSelect[0].selectize;
          const representedRegions = this.representedRegions(selectize.items);

          if (!isRegion) {
            // Adding a country may cause a regions or regions to be represented.
            // We'll add in any full regions so they're not selectable as options.
            // CSS will hide the tag.
            selectize.items.forEach(item => {
              const isItemRegion = getIndexedRegions()[item];
              if (isItemRegion && !representedRegions.includes(item)) {
                selectize.removeItem(item, true);
              }
            });
          }
        },
      });

      this.serviceViews.forEach((serviceVw) => serviceVw.remove());
      this.serviceViews = [];
      const servicesFrag = document.createDocumentFragment();

      this.model.get('services').forEach((serviceMd) => {
        const serviceVw = this.createServiceView({ model: serviceMd });

        this.serviceViews.push(serviceVw);
        serviceVw.render().$el.appendTo(servicesFrag);
      });

      this.$servicesWrap.append(servicesFrag);

      this._$headline = null;
      this._$shipDestinationDropdown = null;
      this._$formFields = null;
      this._$serviceSection = null;
      this._$shipDestinationsSelect = null;
    });

    return this;
  }
}
