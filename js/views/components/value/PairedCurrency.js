import app from '../../../app';
import { ensureMainnetCode } from '../../../data/walletCurrencies';
import baseVw from '../../baseVw';
import { getCurrency } from './valueConfigs';
import Value, { validateValueOpts } from './Value';

// doc me up
// doc me up
// doc me up
// doc me up
// doc me up

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        // These need to be provided as objects.
        // fromCur is the cur that will be in the parenthesis. To cur is likely
        // the app's display currency from settings.
        fromCurValueOptions: {},
        toCurValueOptions: {},
        ...options.initialState,
      },
    };

    super(opts);
  }

  get tagName() {
    return 'span';
  }

  setState(state = {}, options = {}) {
    if (!(
      state.fromCurValueOptions &&
      typeof state.fromCurValueOptions.initialState === 'object'
    )) {
      throw new Error('Please provide an initialState for the fromCurValueOptions.');
    }

    if (!(
      state.toCurValueOptions &&
      typeof state.toCurValueOptions.initialState === 'object'
    )) {
      throw new Error('Please provide an initialState for the toCurValueOptions.');
    }

    try {
      validateValueOpts(state.fromCurValueOptions.initialState);
    } catch (e) {
      console.error('There was an error validating the fromCurValueOptions.');
      throw e;
    }

    try {
      validateValueOpts(state.toCurValueOptions.initialState);
    } catch (e) {
      console.error('There was an error validating the toCurValueOptions.');
      throw e;
    }

    return super.setState(state, options);
  }

  render() {
    super.render();
    const state = this.getState();
    const fromCur = getCurrency(state.fromCurValueOptions.initialState);
    const toCur = getCurrency(state.toCurValueOptions.initialState);

    if (this.fromCurValue) this.fromCurValue.remove();
    if (this.toCurValue) this.toCurValue.remove();

    if (ensureMainnetCode(fromCur) === ensureMainnetCode(toCur)) {
      this.toCurValue = this.createChild(Value, state.toCurValueOptions);
      this.$el.html(this.toCurValue.render().el);
    } else {
      this.$el.html(
        `<span>${
          app.polyglot.t('currencyPairing', {
            baseCurValue: '<span class="js-pairedCurFrom"></span>',
            convertedCurValue: '<span class="js-pairedCurTo"></span>',
          })
        }</span>`
      );

      this.fromCurValue = this.createChild(Value, state.fromCurValueOptions);
      this.getCachedEl('.js-pairedCurFrom')
        .html(this.fromCurValue.render().el);

      this.toCurValue = this.createChild(Value, state.toCurValueOptions);
      this.getCachedEl('.js-pairedCurTo')
        .html(this.toCurValue.render().el);
    }

    return this;
  }
}
