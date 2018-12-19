// import app from '../../../app';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    const opts = {
      select2Opts: {},
      ...options,
      initialState: {
        isFetching: false,
        curs: [],
        selected: undefined,
        ...options.initialState,
      },
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'cryptoCurrencyTradeField';
  }

  events() {
    return {
      'change #editListingCoinType': 'onChangeCoinType',
    };
  }

  onChangeCoinType(e) {
    this.setState({
      selected: e.target.value,
    }, { renderOnChange: false });
  }

  render() {
    super.render();

    loadTemplate('modals/editListing/cryptoCurrencyTradeField.html', t => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    this.getCachedEl('#editListingCoinType').select2(this.options.select2Opts);

    return this;
  }
}
