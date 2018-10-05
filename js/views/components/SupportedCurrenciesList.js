import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import { polyTFallback } from '../../utils/templateHelpers';
import { ensureMainnetCode } from '../../data/walletCurrencies';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        currencies: [],
        processedCurs: [],
        sort: true,
        ...options.initialState,
      },
    };

    super(opts);
  }

  get className() {
    return 'unstyled row';
  }

  get tagName() {
    return 'ul';
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();
    const processedState = {
      ...state,
      // This is a derived field and should not be directly set
      processedCurs: Array.isArray(curState.processedCurs) ?
        curState.processedCurs : [],
    };

    if (Array.isArray(processedState.currencies) &&
      (
        curState.sort !== processedState.sort ||
        !_.isEqual(curState.currencies, state.currencies)
      )) {
      processedState.processedCurs = processedState.currencies
        .map(cur => {
          const code = ensureMainnetCode(cur);
          const displayName = polyTFallback(`cryptoCurrencies.${code}`, cur);

          return {
            code,
            displayName,
            sortDisplayName: displayName.toUpperCase(),
          };
        });

      if (processedState.sort) {
        processedState.processedCurs = _.sortBy(processedState.processedCurs, 'sortDisplayName')
          .map(cur => {
            delete cur.sortDisplayName;
            return cur;
          });
      }
    }

    super.setState(processedState, options);
  }

  render() {
    loadTemplate('components/supportedCurrenciesList.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
