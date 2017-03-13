import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import Sku from '../../../models/listing/Sku';
import baseVw from '../../baseVw';
import VariantInventoryItem from './VariantInventoryItem';

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
    this.itemViews = [];

    // We'll work off of a cloned Skus collection, since we need to
    // add in a mappingId to map between a Sku and the option it origininated
    // from and we don't want the mappingId going back to the server.
    this.skusCl = this.collection.clone();
    this.skusCl.modelId = attrs => attrs.mappingId;

    // Give each Sku a mappingId which links it to the options it originated from
    // in a more robust way than relying on order which can change.
    this.skusCl.forEach(sku => {
      const variantCombo = sku.get('variantCombo');
      sku.set('mappingId', this.buildIdFromVariantCombo(variantCombo));

      // const id = this.buildIdFromVariantCombo(variantCombo);
      // sku.set('mappingId', id);
      // console.log(`the id is ${id}`);
    });

    this.listenTo(this.optionsCl, 'change', () => this.render());
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

  // setCollectionData() {
  //   const formData = this.getFormData();
  //   const skus = [];

  //   Object.keys(formData)
  //     .forEach(key => {
  //       const prop = key.slice(key.lastIndexOf('.') + 1);
  //       const index = key.slice(
  //         key.indexOf('[') + 1,
  //         key.lastIndexOf(']')
  //       );

  //       skus[index] = skus[index] || {};
  //       skus[index][prop] = formData[key];
  //     });


  //   this.skusCl.set(skus);

  //   this.collection.set(
  //     this.skusCl.toJSON()
  //       .map(sku => _.omit(sku, 'mappingId', 'choices'))
  //   );
  // }

  setCollectionData() {
    this.itemViews.forEach(item => item.setModelData());
    this.collection.set(
      this.skusCl.toJSON()
        .map(sku => _.omit(sku, 'mappingId', 'choices'))
    );
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

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

  buildIdFromVariantCombo(variantCombo, options = this.optionsCl) {
    if (!_.isArray(variantCombo)) {
      throw new Error('Please provide a variantCombo as an array.');
    }

    let id = '';

    variantCombo.forEach((variantIndex, index) => {
      const option = options.at(index);

      if (option) {
        const choice = option.get('variants')[variantIndex];

        if (choice) {
          id += `${id.length ? '/' : ''}${option.id}-${choice}`;
        }
      }
    });

    return id;
  }

  // todo: good unit test candidate
  buildInventoryData() {
    const options = this.optionsCl.toJSON();

    // ensure the Sku collection has the latest data from the UI

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
        const id = this.buildIdFromVariantCombo(combo);

        // If there is an existing sku for this variantCombo, we'll
        // merge its data in
        // const sku = this.skusCl.get(id);
        const sku = this.skusCl.findWhere({ mappingId: id });
        // console.log(`i want id ${id}`);

        if (sku) {
          console.log('gotta sku');

          data = {
            ...data,
            ...sku.toJSON(),
          };
        } else {
          console.log('no no no no sku');

          // If no sku, we'll merge in a new Sku model so the model's
          // defaults get into the data
          data = {
            ...data,
            ...((new Sku()).toJSON()),
            // _clientID: guid(),
            mappingId: id,
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
    const inventoryData = this.buildInventoryData();
    this.skusCl.set(inventoryData.inventory);

    console.log('skus');
    window.skus = this.skusCl;

    loadTemplate('modals/editListing/variantInventory.html', (t) => {
      this.$el.html(t({
        columns: inventoryData.columns,
        inventory: this.skusCl.toJSON(),
        getPrice: this.options.getPrice,
        getCurrency: this.options.getCurrency,
      }));

      this.itemViews.forEach(item => item.remove());
      this.itemViews = [];
      const itemsFrag = document.createDocumentFragment();

      this.skusCl.forEach(item => {
        // todo: doc the parent validation error!
        // const correspondingMd = this.collection.get(item.get('_clientID'));
        // item.validationError = correspondingMd && correspondingMd.validationError || {};

        const view = this.createChild(VariantInventoryItem, {
          model: item,
          getPrice: this.options.getPrice,
          getCurrency: this.options.getCurrency,
        });

        this.itemViews.push(view);
        view.render().$el.appendTo(itemsFrag);
      });

      this.$('> table').append(itemsFrag);

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
