import app from '../../../app';
import baseVw from '../../baseVw';
import Value from './Value';

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
        // These will be passed onto the nested Value components.
        fromCurValueOptions: {},
        toCurValueOptions: {},
        ...options.initialState,
      },
    };

    // console.log('charlie zen ==>');
    // console.dir(options);
    // console.log('<== charlie zen');
    // console.log('\n');


    // console.log('flee fluy ==>');
    // console.dir(opts);
    // console.log('<== flee fluy');
    // console.log('\n');

    super(opts);
  }

  get tagName() {
    return 'span';
  }

  setState(state = {}, options = {}) {
    // if (typeof state.valueOptions !== 'object') {
    //   throw new Error('state.valueOptions must be provided as an object.');
    // }

    // if (typeof state.valueOptions.amount !== 'number') {
    //   throw new Error('state.valueOptions.priceAmount must be provided as ' +
    //     'a number.');
    // }

    // if (typeof state.valueOptions.fromCur !== 'string' ||
    //   !state.valueOptions.fromCur) {
    //   throw new Error('state.valueOptions.fromCur must be provided as ' +
    //     'a non-empty string.');
    // }

    // if (typeof state.valueOptions.toCur !== 'string' ||
    //   !state.valueOptions.toCur) {
    //   throw new Error('state.valueOptions.toCur must be provided as ' +
    //     'a non-empty string.');
    // }

    // if (typeof state.priceModifier !== 'number') {
    //   throw new Error('state.priceModifier must be provided as ' +
    //     'a number');
    // }

    return super.setState(state, options);
  }

  render() {
    super.render();
    const state = this.getState();

    this.$el.html(
      `<span class="suckIt">${
        app.polyglot.t('currencyPairing', {
          baseCurValue: '<span class="js-pairedCurFrom"></span>',
          convertedCurValue: '<span class="js-pairedCurTo"></span>',
        })
      }</span>`
    );

    if (this.fromCurValue) this.fromCurValue.remove();
    if (this.toCurValue) this.toCurValue.remove();

    this.fromCurValue = this.createChild(Value, state.fromCurValueOptions);
    this.getCachedEl('.js-pairedCurFrom')
      .html(this.fromCurValue.render().el);

    this.toCurValue = this.createChild(Value, state.toCurValueOptions);
    this.getCachedEl('.js-pairedCurTo')
      .html(this.toCurValue.render().el);

    return this;
  }
}
