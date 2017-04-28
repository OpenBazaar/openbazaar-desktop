// import app from '../../../app';
import _ from 'underscore';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        curPage: 1,
      },
      ...options,
    };

    if (!opts.initialState ||
      typeof opts.initialState.curPage !== 'number' ||
      typeof opts.initialState.totalPages !== 'number' ||
      typeof opts.initialState.total !== 'number') {
      throw new Error('At a minimum, please provide an initialState with curPage, ' +
        'totalPages and total values.');
    }

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
    this.setState({
      curPage: this.getState().curPage--,
    });
  }

  onClickPrev() {
    this.trigger('clickPrev');
    this.setState({
      curPage: this.getState().curPage++,
    });
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
