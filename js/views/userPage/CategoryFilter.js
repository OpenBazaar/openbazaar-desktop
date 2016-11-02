import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.options.categories) {
      throw new Error('Please provide a list of categories.');
    }

    this.categories = this.options.categories;
    this._selected = this.options.selected || 'all';
    this.expanded = false;
  }

  className() {
    return 'clrP clrBr border padMd clrT categoryFilter';
  }

  events() {
    return {
      'click .js-showMoreLess': 'onClickShowMoreLess',
      'change input[type="radio"]': 'onChangeCategory',
    };
  }

  onClickShowMoreLess() {
    if (this.expanded) {
      this.expanded = false;
      this.$moreCatsWrap.removeClass('expanded');
      // this.$moreCats.addClass('hide');
      // this.$showMore.addClass('hide');
    } else {
      this.expanded = true;
      this.$moreCatsWrap.addClass('expanded');
      // this.$moreCats.removeClass('hide');
    }
  }

  onChangeCategory(e) {
    this.trigger('category-change', { value: $(e.target).val() });
  }

  get selectedCat() {
    return this._selected;
  }

  // get $moreCats() {
  //   return this._$moreCats ||
  //     (this._$moreCats = this.$('.js-moreCats'));
  // }

  // get $showMore() {
  //   return this._$showMore ||
  //     (this._$showMore = this.$('.js-showMore'));
  // }

  get $moreCatsWrap() {
    return this._$moreCatsWrap ||
      (this._$moreCatsWrap = this.$('.js-moreCatsWrap'));
  }

  render() {
    loadTemplate('userPage/categoryFilter.html', (t) => {
      this.$el.html(t({
        categories: this.categories,
        selected: this.selectedCat,
        maxInitiallyVisibleCats: 6,
        expanded: this.expanded,
      }));
    });

    // this._$moreCats = null;
    // this._$showMore = null;
    this._$moreCatsWrap = null;

    return this;
  }
}
