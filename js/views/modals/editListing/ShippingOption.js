import $ from 'jquery';
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
    this.select2CountryData = getTranslatedRegions(app.settings.get('language'))
      .map(regionObj => ({
        id: regionObj.id,
        text: `REGION_${regionObj.name}`,
      }));

    // now, we'll add in the countries
    const select2countries = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({
        id: countryObj.dataName,
        text: countryObj.name,
      }));
    this.select2CountryData = this.select2CountryData.concat(select2countries);

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

  get fullRegions() {
    // Returns a list of any regions that are fully represented
    // in the country dropdown (i.e. all the individual countries
    // of the region are selected - the actual region selection may
    // or may not be)
    const curSelectionVal = this.$shipDestinationSelect.val();
    const selectedRegions = [];

    regions.forEach(region => {
      if (region.countries.every(elem => curSelectionVal.indexOf(elem) > -1)) {
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
        // escapeMarkup: (text) => text,
        templateSelection: (data) => {
          const text = data.text.startsWith('REGION_') ?
            data.text.slice(7) : data.text;

          return text;
        },
        templateResult: (data) => {
          const text = data.text.startsWith('REGION_') ?
            data.text.slice(7) : data.text;

          return text;
        },
      }).on('change', (e, ignoreRegions = false) => {
        this.$shipDestinationsPlaceholder[
          this.$shipDestinationSelect.val().length ? 'removeClass' : 'addClass'
        ]('emptyOfTags');

        if (ignoreRegions) return;

        setTimeout(() => {
          const curSelected = $(e.target).val();
          const newSelected = this.fullRegions;
          const indexedRegions = getIndexedRegions();

          curSelected.forEach(selected => {
            // We started the newSelected list with any fully
            // represented regions, not we'll add in the selected
            // countries.
            if (!indexedRegions[selected]) {
              newSelected.push(selected);
            }
          });

          $(e.target).val(newSelected)
            .trigger('change', true)
            .select2('close');
        });
      }).on('select2:selecting', (e) => {
        // manage regions
        const region = getIndexedRegions()[e.params.args.data.id];

        if (region) {
          // decide whether we should add or remove the region
          if (this.fullRegions.indexOf(e.params.args.data.id) !== -1) {
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
      })
      .on('select2:unselecting', (e) => {
        // manage regions
        const region = getIndexedRegions()[e.params.args.data.id];

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
