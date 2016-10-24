import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries, getCountryByDataName } from '../../../data/countries';
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
    this.select2CountryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));
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
    return this._$headline || this.$('h1');
  }

  get $shipDestinationDropdown() {
    return this._$shipDestinationDropdown || this.$(`#shipDestinationsDropdown_${this.model.cid}`);
  }

  get $serviceSection() {
    return this._$serviceSection || this.$('.js-serviceSection');
  }

  get $formFields() {
    return this.$('select[name], input[name], textarea[name]').filter((index, el) => (
      !$(el).parents('.js-serviceSection').length));
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
    });

    return this;
  }
}
