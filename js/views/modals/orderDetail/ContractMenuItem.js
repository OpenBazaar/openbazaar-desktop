import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        tip: '',
        tipClass: 'toolTip clrTAlert',
        tipIconClass: 'ion-alert-circled padSm',
        ...options.initialState || {},
      },
    };

    super(opts);
  }

  className() {
    return 'js-tab tab row contractMenuItem';
  }

  tagName() {
    return 'a';
  }

  attributes() {
    return { 'data-tab': 'contract' };
  }

  events() {
    return {
      'click .js-openDispute': 'onClickOpenDispute',
    };
  }

  render() {
    loadTemplate('modals/orderDetail/contractMenuItem.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
