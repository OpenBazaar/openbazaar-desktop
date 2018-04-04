import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
// import VerifiedMod from '../../models/VerifiedMod';
// import app from '../../app';
import { isHiRez } from '../../utils/responsive';
import { handleLinks } from '../../utils/dom';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        verified: false,
        text: '',
        textClass: 'txB',
        textWrapperClass: 'flexVCent',
        infoIconClass: 'ion-information-circled clrT2',
        tipTitle: options.initialState &&
          typeof options.initialState.tipTitle === 'undefined' &&
          options.initialState.text || '',
        tipTitleClass: 'tx4 txB',
        titleWrapperClass: 'flexCent row',
        tipBody: '',
        arrowClass: 'arrowBoxCenteredTop',
        badgeUrl: '',
        ...options.initialState || {},
      },
    };

    if (!opts.initialState.badgeUrl &&
      typeof opts.badge === 'object') {
      opts.initialState.badgeUrl = isHiRez ?
        opts.badge.small : opts.badge.tiny;
    }

    super(opts);
    handleLinks(this.el);
  }

  className() {
    return 'verifiedMod';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick(e) {
    e.stopPropagation();
  }

  render() {
    super.render();
    loadTemplate('/components/verifiedMod.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
