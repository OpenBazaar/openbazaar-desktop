import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries, getCountryByDataName } from '../../../data/countries';
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
    this.select2CountryData = getTranslatedRegions(app.settings.get('language'))
      .map(regionObj => ({ id: regionObj.id, text: regionObj.name }));

    // now, we'll add in the countries
    const select2countries = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({
        id: countryObj.dataName,
        text: countryObj.name,
      }));
    this.select2CountryData = this.select2CountryData.concat(select2countries);

    // let's index the country / region list for fast retrieval
    // this.indexedCountries = this.select2CountryData.reduce((indexedObj, country) => {
    //   indexedObj[country.id] = _.omit(country, 'id');
    //   return indexedObj;
    // }, {});

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

  // Sets the model based on the current data in the UI.
  setModelData() {
    // set the data for our nested Services views
    this.serviceViews.forEach((serviceVw) => serviceVw.setModelData());
    this.model.set(this.getFormData(this.$formFields));
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

  get $shipDestinationsSelect() {
    return this._$shipDestinationsSelect ||
      (this._$shipDestinationsSelect = this.$('.js-shipDestinationsSelect'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]').filter((index, el) => (
          !$(el).parents('.js-serviceSection').length)));
  }

  get selectedRegions() {
    // Returns a list of any regions that are fully represented
    // in the country dropdown
    const curSelectionVal = this.$shipDestinationSelect.val();
    const selectedRegions = [];

    regions.forEach(region => {
      if (region.countries.every(elem => curSelectionVal.indexOf(elem.id) > -1)) {
        selectedRegions.push(region.id);
      }
    });

    return selectedRegions;
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
        countrySelectOptions: this.select2CountryData,
        ...this.model.toJSON(),
        // regions: this.model.get('regions').map(region => {
        //   const countryData = getCountryByDataName(region);

        //   return {
        //     text: countryData.name,
        //     value: region,
        //   };
        // }),
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
        // escapeMarkup: function(markup) {
        //   return markup;
        // },
        // templateSelection: (data) => {
        //   // `<option value="${option.id}" ${selected ? 'selected="selected"' : ''}>${option.text}</option>`
        //   return $('<span />').text('moonshine');
        // },
      }).on('change', () => {
        this.$shipDestinationsPlaceholder[
          this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
        ]('emptyOfTags');
      }).on('select2:selecting', (e) => {
        // manage regions
        const region = getIndexedRegions()[e.params.args.data.id];

        console.log('moo');
        window.moo = region;

        if (region) {
          console.log('sugar: ' + (e.params.args.data.id));
          window.sugar = this.selectedRegions;
          // adding or removing a region

          if (this.selectedRegions.indexOf(e.params.args.data.id) !== -1) {
            // the region is fully represented, so we'll remove it
            $(e.target).val(
              $(e.target).val()
                .filter(selectedCountry =>
                  (region.countries.indexOf(selectedCountry) === -1))
            ).trigger('change');
          } else {
            // the region is not fully represented, so we'll add it
            $(e.target).val(
              $(e.target).val()
                .concat(region.countries)
            ).trigger('change');
          }
        }

        // make sure any fully represented regions are in
        // the dropdown
        setTimeout(() => {
          const regionsToAdd = [];

          this.selectedRegions.forEach(selectedRegion => {
            if ($(e.target).val().indexOf(selectedRegion) === -1) {
              regionsToAdd.push(selectedRegion);
            }
          });

          if (regionsToAdd.length) {
            $(e.target).val((
              $(e.target).val().concat(regionsToAdd)
            )).trigger('change');
          }
        });
      })
      .on('select2:unselecting', (e) => {
        // manage regions
        const region = getIndexedRegions()[e.params.args.data.id];

        console.log('hippo');

        if (region) {
          $(e.target).val(
            $(e.target).val()
              .filter(country =>
                region.countries.indexOf(country) === -1)
          ).trigger('change');
        }
      });

      this.$shipDestinationsPlaceholder[
        this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
      ]('emptyOfTags');

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
