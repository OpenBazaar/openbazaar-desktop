import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        hidden: true,
        showSpinner: true,
        loaded: 0,
        total: 0,
        mode: 'loaded',
        ...(options && options.initialState || {}),
      },
      ...options,
     };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'moderatorStatus';
  }

  render() {
    super.render();

    loadTemplate('components/moderatorsStatus.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
