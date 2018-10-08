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
    loadTemplate('components/pageControlsTextStyle.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
