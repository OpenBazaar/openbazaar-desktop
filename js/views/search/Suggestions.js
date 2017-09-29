import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';

export default class extends BaseView {
  constructor(options = {}) {

    const opts = {
      initialState: {
        suggestions: [],
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'suggestions flex gutterH row tx5 noOverflow';
  }

  events() {
    return {
      'click .js-suggestion': 'onClickSuggestion',
    };
  }

  onClickSuggestion(e) {
    const suggestion = $(e.target).data('suggestion');
    this.trigger('clickSuggestion', { suggestion });
  }

  render() {
    super.render();
    const state = this.getState();
    loadTemplate('search/Suggestions.html', t => {
      this.$el.html(t({
        ...this.options,
        ...state,
      }));
    });

    return this;
  }
}
