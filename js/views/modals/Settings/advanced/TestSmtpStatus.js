import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        success: true,
        msg: '',
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'testSmtpStatus';
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/testSmtpStatus.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
