import $ from 'jquery';
import _ from 'underscore';
import loadTemplate from '../utils/loadTemplate';
import BaseVw from './baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      curRating: 0,
      maxRating: 5,
      hoverIndex: 0,
      iconClrClass: '',
      numberClrClass: 'clrT2',
      clickable: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'ratingStrip';
  }

  events() {
    return {
      'click .js-ratingIcon': 'onClickRatingIcon',
    };
  }

  onClickRatingIcon(e) {
    // Important!!! In order to simulate a previous sibling selector in
    // CSS and hover all the previos icons on hover, the icons are
    // displayed in reverse order via flex-direction. This requires index
    // calculations to be computed from the end.
    const totalIcons = this.getState().maxRating;
    this.setState({ curRating: totalIcons - $(e.target).closest('.js-ratingIcon').index() });
  }

  get rating() {
    return this.getState().curRating;
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('ratingsStrip.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
