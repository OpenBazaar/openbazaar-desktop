/* categoryFilter.js and typeFilter.js share quite a bit. Ensure that when one is updated,
the other is also maintained.
*/

import $ from 'jquery';
import _ from 'underscore';
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
    this._state = opts.initialState;
  }

  className() {
    return `clrP clrBr padMd clrT contentBox clrSh2 form veryCompact categoryOrTypeFilter`;
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

  get selectedCat() {
    return this._selected;
  }

  getState() {
    return this._state;
  }

  setState(state = {}) {
    const newState = {
      ...this._state,
      ...state,
    };

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      if (this.rendered) this.render();
    }
  }

  replaceState(state = {}) {
    if (!_.isEqual(this._state, state)) {
      this._state = state;
      if (this.rendered) this.render();
    }
  }

  render() {
    if (this.getState().categories.length === 1) {
      this.$el.addClass('disabled');
    }

    loadTemplate('userPage/categoryFilter.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    this.rendered = true;

    return this;
  }
}
