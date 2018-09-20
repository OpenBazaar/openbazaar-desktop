// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        cur: '',
        displayCur: '',
        balance: undefined,
        transactionCount: undefined,
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'coinStats border clrP clrBr clrSh3';
  }

  // tagName() {
  //   return 'li';
  // }

  // events() {
  //   return {
  //     click: 'onClick',
  //   };
  // }

  render() {
    loadTemplate('modals/wallet/coinStats.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
