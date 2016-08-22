import $ from 'jquery';
import BaseVw from './BaseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.scrollLinksSelector || !(typeof options.scrollLinksSelector === 'string')) {
      throw new Error('Please provide a css selector targetting the scroll anchors.');
    }

    if (!options.contentSelector || !(typeof options.contentSelector === 'string')) {
      throw new Error('Please provide a css selector targetting the scroll content sections.');
    }

    if (!options.scrollContainer || !options.scrollContainer instanceof $) {
      throw new Error('Please provide a jQuery object containing the scroll container.');
    }

    super(options);
    this.options = options;
    this._$scrollContainer = $(options.scrollContainer).eq(0);
  }

  events() {
    const events = {};


    events[`click ${this.options.scrollLinksSelector}`] = 'onScrollAnchorClick';

    return {
      ...super.events,
    };
  }

  get scrollContainer() {
    return this._$scrollContainer;
  }

  set scrollContainer($el) {
    if (!($el instanceof $)) {
      throw new Error('Please provide a jQuery object containing the scroll container.');
    }

    this._$scrollContainer = $el;
  }

  onScrollAnchorClick(e) {
    console.log(`you click anchor ${$(e.target).text()}`);
  }
}

