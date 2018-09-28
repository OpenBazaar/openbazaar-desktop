import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        start: 1,
        ...options.initialState,
      },
    };

    super(opts);
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

  render() {
    const path = this.getState().type === 'search' ?
      'components/pageControlsSearch.html' : 'components/pageControls.html';
    loadTemplate(path, (t) => {
      this.$el.html(t({
        type: this.type,
        ...this.getState(),
      }));
    });

    return this;
  }
}
