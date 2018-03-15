// import $ from 'jquery';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a Listing model.');
    }

    super(options);
    // this.options = options;
  }

  events() {
    return {
      // 'click .js-removeShippingOption': 'onClickRemoveShippingOption',
    };
  }

  // tagName() {
  //   return 'section';
  // }


  // getFormData(fields = this.$formFields) {
  //   const formData = super.getFormData(fields);
  //   this.model.set
  //   const indexedRegions = getIndexedRegions();

  //   // Strip out any region elements from shipping destinations
  //   // drop down. The individual countries will remain.
  //   formData.regions = formData.regions
  //     .filter(region => !indexedRegions[region]);

  //   return formData;
  // }

  // // Sets the model based on the current data in the UI.
  // setModelData() {
  //   // set the data for our nested Services views
  //   this.serviceViews.forEach((serviceVw) => serviceVw.setModelData());
  //   this.model.set(this.getFormData());
  // }

  // get $formFields() {
  //   return this.getCachedEl('select[name], input[name], textarea[name]');
  // }

  render() {
    super.render();
    loadTemplate('modals/editListing/cryptoCurrencyType.html', t => {
      this.$el.html(t({
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      // this.$(`#shipOptionType_${this.model.cid}`).select2({
      //   // disables the search box
      //   minimumResultsForSearch: Infinity,
      // });
    });

    return this;
  }
}
