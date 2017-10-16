import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      reported: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'reportBtn';
  }

  attributes() {
    // make it possible to tab to this element
    return { tabIndex: 0 };
  }

  events() {
    return {
      'click .js-reportBtn': 'onClickReportBtn',
    };
  }

  onClickReportBtn(e) {
    e.stopPropagation();
    this.trigger('startReport');
  }


  render() {
    super.render();

    loadTemplate('reportBtn.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
