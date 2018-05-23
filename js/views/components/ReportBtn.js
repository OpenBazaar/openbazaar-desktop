import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import { recordEvent } from '../../utils/metrics';

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
    if (!this.getState().reported) {
      this.trigger('startReport');
      recordEvent('ReportListing');
    }
  }


  render() {
    loadTemplate('components/reportBtn.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
