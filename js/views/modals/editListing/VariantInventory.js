// import $ from 'jquery';
// import _ from 'underscore';
import { formatPrice } from '../../../utils/currency';
import loadTemplate from '../../../utils/loadTemplate';
import Sku from '../../../models/listing/Sku';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a Skus collection.');
    }

    if (!options.optionsCl) {
      throw new Error('Please provide an options collection.');
    }

    if (typeof options.getPrice !== 'function') {
      throw new Error('Please provide a getPrice function that returns the product price.');
    }

    if (typeof options.getCurrency !== 'function') {
      throw new Error('Please provide a function for me to obtain the current currency.');
    }

    super(options);
    this.options = options || {};
    this.optionsCl = options.optionsCl;

    // this._state = {
    //   showQuanity: true,
    //   ...options.initialState || {},
    // };

    this.listenTo(this.collection, 'change', () => this.render());
    // this.listenTo(this.optionsCl, 'change', () => this.render());
  }

  className() {
    return 'scrollBoxX';
  }

  // events() {
  //   return {
  //     'click .js-btnConnect': 'onConnectClick',
  //   };
  // }

  // get $deleteConfirm() {
  //   return this._$deleteConfirm ||
  //     (this._$deleteConfirm = this.$('.js-deleteConfirm'));
  // }

  // remove() {
  //   super.remove();
  // }

  // Inpsired by: http://stackoverflow.com/a/4331218/632806
  // TODO: would be nice to unit test this guy
  allPossibleCombos(arr) {
    let returnVal;

    if (!arr.length) {
      return [];
    }

    if (arr.length === 1) {
      returnVal = arr[0].map((val, index) => (index));
    } else {
      const result = [];
      const allCasesOfRest = this.allPossibleCombos(arr.slice(1));  // recur with the rest of array
      for (let i = 0; i < allCasesOfRest.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
          result.push(`${j}, ${allCasesOfRest[i]}`);
        }
      }
      return result;
    }

    return returnVal;
  }

  // todo: good unit test candidate
  buildInventoryData() {
    const options = this.optionsCl.toJSON();

    // ensure the Sku collection has the latest data from the UI

    // we'll get any existing quantities and surcharges from the sku collection
    const skuData = this.collection.clone();

    // ensure each sku has an id
    skuData.forEach(sku => {
      // build an id off of the variant choices
      let id = '';

      sku.get('variantCombo')
        .forEach((variantComboIndex, index) => {
          id += `${id.length ? '/' : ''}${options[index].variants[variantComboIndex]}`;
        });

      sku.set('id', id);
    });

    const inventoryData = [];

    this.allPossibleCombos(options.map(option => (option.variants)))
      .sort()
      .map(strCombo => JSON.parse(`[${strCombo}]`))
      .forEach(combo => {
        const choices = [];

        combo.forEach((comboIndex, index) => {
          choices.push(options[index].variants[comboIndex]);
        });

        let data = {
          choices,
          variantCombo: combo,
        };
        const id = choices.join('/');

        // If there is an existing sku for this variantCombo, we'll
        // merge it's data in
        const sku = skuData.get(id);

        if (sku) {
          data = {
            ...data,
            ...sku,
          };
        } else {
          // If no sku, we'll merge in a new Sku model so the model's
          // defaults get into the data
          data = {
            ...data,
            ...((new Sku()).toJSON()),
          };
        }

        inventoryData.push(data);
      });

    return {
      columns: options.map(option => option.name),
      inventory: inventoryData,
    };
  }

  render() {
    loadTemplate('modals/editListing/variantInventory.html', (t) => {
      this.$el.html(t({
        ...this.buildInventoryData(),
        getPrice: this.options.getPrice,
        getCurrency: this.options.getCurrency,
        formatPrice,
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
