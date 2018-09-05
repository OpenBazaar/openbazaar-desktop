/* categoryFilter.js and typeFilter.js share quite a bit. Ensure that when one is updated,
the other is also maintained.
*/

import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    opts.initialState = {
      categories: [],
      selected: 'all',
      expanded: false,
      maxInitiallyVisibleCats: 6,
      ...(options.initialState || {}),
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'clrP clrBr padMd clrT contentBox clrSh2 form veryCompact categoryOrTypeFilter';
  }

  events() {
    return {
      'click .js-showMoreLess': 'onClickShowMoreLess',
      'change input[type="radio"]': 'onChangeCategory',
    };
  }

  onClickShowMoreLess() {
    this.setState({ expanded: !this.getState().expanded });
  }

  onChangeCategory(e) {
    this._state.selected = e.target.value;
    this.trigger('category-change', { value: $(e.target).val() });
  }

  render() {
    loadTemplate('userPage/categoryFilter.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
