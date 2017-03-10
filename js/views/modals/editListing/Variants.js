import loadTemplate from '../../../utils/loadTemplate';
import Option from '../../../models/listing/Option';
import BaseView from '../../baseVw';
import Variant from './Variant';

// There are some terminology mismatches between the UI and server. When the UI uses the
// term 'variant', it maps to an 'options' list in the listing API.
export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide an Options collection.');
    }

    if (typeof options.maxVariantCount === 'undefined') {
      throw new Error('Please provide the maximum variant count.');
    }

    // Certain option validations are not possible to do purely in an individual
    // Option model because they are validations relative to other Options / Skus.
    // In that case, any higher level option related errors can be optionally passed in,
    // in the following format:
    // options.optionErrors = {
    //   options[<model.cid>].<fieldName> = ['error1', 'error2', ...],
    //   options[<model.cid>].<fieldName2> = ['error1', 'error2', ...],
    //   options[<model2.cid>].<fieldName> = ['error1', 'error2', ...]
    // }

    super(options);
    this.options = options;
    this.variantViews = [];

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

      this.variantViews.splice(index, 0, view);

      if (this.collection.length >= this.options.maxVariantCount) {
        this.$btnAddVariant.addClass('hide');
      }
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.variantViews.splice(removeOpts.index, 1)[0]).remove();

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
    this.collection.add(new Option());
    this.variantViews[this.variantViews.length - 1]
      .$('input[name=name]')
      .focus();
  }

  setCollectionData() {
    this.variantViews.forEach(variant => variant.setModelData());
  }

  createVariantView(model, options = {}) {
    const variantErrors = {};

    if (this.options.variantErrors) {
      Object.keys(this.options.variantErrors)
        .forEach(errKey => {
          if (errKey.startsWith(`options[${model.cid}]`)) {
            variantErrors[errKey.slice(errKey.indexOf('.') + 1)] =
              this.options.couponErrors[errKey];
          }
        });
    }

    const view = this.createChild(Variant, {
      model,
      variantErrors,
      ...options,
    });

    this.listenTo(view, 'remove-click', e =>
      this.collection.remove(e.view.model));

    return view;
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

      this.variantViews.forEach(variant => variant.remove());
      this.variantViews = [];
      const variantsFrag = document.createDocumentFragment();

      this.collection.forEach(variant => {
        const view = this.createVariantView(variant);
        this.variantViews.push(view);
        view.render().$el.appendTo(variantsFrag);
      });

      this.$variantsWrap.append(variantsFrag);
    });

    return this;
  }
}
