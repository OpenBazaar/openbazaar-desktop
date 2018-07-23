import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        fetchFailed: false,
      },
      ...options,
    };

    super(opts);
    this.options = opts;

    if (this.model) this.setModel(this.model);

    this._state = {
      ...opts.initialState || {},
    };
  }

  className() {
    return 'profileBox';
  }

  setModel(md) {
    if (this.model === md) return;
    if (this.model) this.stopListening(this.model);
    this.listenTo(md, 'change', () => this.render());
    this.model = md;
    this.render();
  }

  render() {
    loadTemplate('modals/orderDetail/profileBox.html', t => {
      this.$el.html(t({
        ...this._state,
        ...this.model && this.model.toJSON() || {},
      }));
    });

    return this;
  }
}
