import $ from 'jquery';
import '../../lib/select2';
import baseVw from '../baseVw';
import { selectEmojis } from '../../utils';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        filters: {},
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
  }

  className() {
    return 'filters';
  }

  events() {
    return {
      'change select': 'changeFilter',
      'change input': 'changeFilter',
      'click .js-selectAll': 'clickFilterAll',
      'click .js-selectNone': 'clickFilterNone',
    };
  }

  retrieveFormData() {
    return this.getFormData(this.$filters);
  }

  changeFilter() {
    this.trigger('filterChanged', this.retrieveFormData());
  }

  makeFilterAllOrNone(name, all = true) {
    const filters = this.getState().filters;
    const processedData = filters[name];
    processedData.options.forEach((opt, i) => {
      processedData.options[i].checked = all;
    });
    filters[name] = processedData;
    this.setState({ filters });
    this.render(); // The shallow compare in setState won't recognize the filters changed;
    this.changeFilter();
  }

  clickFilterAll(e) {
    this.makeFilterAllOrNone($(e.target).prop('name'), true);
  }

  clickFilterNone(e) {
    this.makeFilterAllOrNone($(e.target).prop('name'), false);
  }

  render() {
    super.render();

    loadTemplate('search/filters.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    this.$('select').select2({
      minimumResultsForSearch: 10,
      templateResult: selectEmojis,
      templateSelection: selectEmojis,
    });
    this.$filters = this.$el.find('select, input');

    return this;
  }
}
