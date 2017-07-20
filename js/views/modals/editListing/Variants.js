import loadTemplate from '../../../utils/loadTemplate';
import VariantOption from '../../../models/listing/VariantOption';
import BaseView from '../../baseVw';
import Variant from './Variant';

// There are some terminology mismatches between the UI and server. When the UI uses the
// term 'variant', it maps to an 'options' list in the listing API.
export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide an VariantOptions collection.');
    }

    if (typeof options.maxVariantCount === 'undefined') {
      throw new Error('Please provide the maximum variant count.');
    }

    // Certain variant validations are not possible to do purely in the model and
    // need to be done by a parent model. In that case higher-level errors can be passed
    // in the following format:
    // options.errors = {
    //   options[<model.cid>].<fieldName> = ['error1', 'error2', ...],
    //   options[<model.cid>].<fieldName2> = ['error1', 'error2', ...],
    //   options[<model2.cid>].<fieldName> = ['error1', 'error2', ...]
    // }

    super(options);
    this.options = options;
    this._variantViews = [];

    this.listenTo(this.collection, 'add', (md, cl) => {
      const index = cl.indexOf(md);
      const view = this.createVariantView(md);

      if (index) {
        this.$variantsWrap.find('> *')
          .eq(index - 1)
          .after(view.render().el);
      } else {
        this.$variantsWrap.prepend(view.render().el);
      }

      this._variantViews.splice(index, 0, view);

      if (this.collection.length >= this.options.maxVariantCount) {
        this.$btnAddVariant.addClass('hide');
      }
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this._variantViews.splice(removeOpts.index, 1)[0]).remove();

      if (this.collection.length < this.options.maxVariantCount) {
        this.$btnAddVariant.removeClass('hide');
      }
    });
  }

  events() {
    return {
      'click .js-btnAddVariant': 'onClickAddVariant',
    };
  }

  onClickAddVariant() {
    this.collection.add(new VariantOption());
    this._variantViews[this._variantViews.length - 1]
      .$('input[name=name]')
      .focus();
  }

  setCollectionData() {
    this._variantViews.forEach(variant => variant.setModelData());
  }

  setModelData(index) {
    if (typeof index !== 'number') {
      throw new Error('Please provide a numeric index.');
    }

    const view = this._variantViews[index];
    if (view) view.setModelData();
  }

  createVariantView(model, options = {}) {
    const errors = {};

    if (this.options.errors) {
      Object.keys(this.options.errors)
        .forEach(errKey => {
          if (errKey.startsWith(`options[${model.cid}]`)) {
            errors[errKey.slice(errKey.indexOf('.') + 1)] =
              this.options.errors[errKey];
          }
        });
    }

    const view = this.createChild(Variant, {
      model,
      errors,
      ...options,
    });

    this.listenTo(view, 'removeClick', e =>
      this.collection.remove(e.view.model));

    this.listenTo(view, 'choiceChange', e =>
      this.trigger('variantChoiceChange', e));

    return view;
  }

  get views() {
    return this._variantViews;
  }

  get $btnAddVariant() {
    return this._$btnAddVariant ||
      (this._$btnAddVariant =
        this.$('.js-btnAddVariant'));
  }

  render() {
    loadTemplate('modals/editListing/variants.html', t => {
      this.$el.html(t({
        variants: this.collection.toJSON(),
        maxVariantCount: this.options.maxCouponCount,
      }));

      this.$variantsWrap = this.$('.js-variantsWrap');
      this._$btnAddVariant = null;

      this._variantViews.forEach(variant => variant.remove());
      this._variantViews = [];
      const variantsFrag = document.createDocumentFragment();

      this.collection.forEach(variant => {
        const view = this.createVariantView(variant);
        this._variantViews.push(view);
        view.render().$el.appendTo(variantsFrag);
      });

      this.$variantsWrap.append(variantsFrag);
    });

    return this;
  }
}
