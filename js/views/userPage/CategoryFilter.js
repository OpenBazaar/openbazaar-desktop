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
    } else {
      this.expanded = true;
      this.$moreCatsWrap.addClass('expanded');
    }
  }

  onChangeCategory(e) {
    this._selected = e.target.value;
    this.trigger('category-change', { value: $(e.target).val() });
  }

  get selectedCat() {
    return this._selected;
  }

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

    this._$moreCatsWrap = null;

    return this;
  }
}
