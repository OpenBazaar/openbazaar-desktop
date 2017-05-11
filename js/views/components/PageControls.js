import _ from 'underscore';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        start: 1,
      },
      ...options,
    };

    super(opts);

    this._state = {
      ...opts.initialState || {},
    };
  }

  className() {
    return 'pageControlsWrapper overflowAuto';
  }

  events() {
    return {
      'click .js-pageNext': 'onClickNext',
      'click .js-pagePrev': 'onClickPrev',
    };
  }

  onClickNext() {
    this.trigger('clickNext');
  }

  onClickPrev() {
    this.trigger('clickPrev');
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('components/pageControls.html', (t) => {
      this.$el.html(t({
        type: this.type,
        ...this._state,
      }));
    });

    return this;
  }
}
