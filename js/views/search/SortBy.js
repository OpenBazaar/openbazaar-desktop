import $ from 'jquery';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { selectEmojis } from '../../utils';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'row flexVBase gutterH';
  }

  events() {
    return {
      'change .js-sortBy': 'changeSortBy',
    };
  }

  changeSortBy(e) {
    this.trigger('changeSortBy', { sortBy: $(e.target).val() });
  }

  render() {
    super.render();

    loadTemplate('search/sortBy.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));

      this.$('#sortBy').select2({
        minimumResultsForSearch: Infinity, // disables the search box
        templateResult: selectEmojis,
        templateSelection: selectEmojis,
      });
    });

    return this;
  }
}
