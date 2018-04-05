import app from '../../app';
import VerifiedMod from '../../models/VerifiedMod';
import loadTemplate from '../../utils/loadTemplate';
import { isHiRez } from '../../utils/responsive';
import { handleLinks } from '../../utils/dom';
import BaseVw from '../baseVw';

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

export function getModeratorOptions(options = {}) {
  const opts = {
    shortText: true,
    verified: !!options.model,
    ...options,
  };

  if (opts.model &&
    !(opts.model instanceof VerifiedMod)) {
    throw new Error('If providing a model, it should be an instance of ' +
      'a VerifiedMod model.');
  }

  const textKey = opts.shortText ?
    'titleShort' : 'titleLong';

  return {
    badge: opts.model &&
      opts.model.get('type').badge || undefined,
    initialState: {
      verified: opts.verified,
      text: opts.verified ?
        app.polyglot.t(`verifiedMod.modVerified.${textKey}`) :
        app.polyglot.t(`verifiedMod.modUnverified.${textKey}`),
      textClass: 'txB tx5b',
      tipTitle: opts.verified ?
        app.polyglot.t('verifiedMod.modVerified.titleLong') :
        app.polyglot.t('verifiedMod.modUnverified.titleLong'),
      tipBody: opts.verified ?
        app.polyglot.t('verifiedMod.modVerified.tipBody', {
          name: `<b>${app.verifiedMods.data.name}</b>`,
          link: app.verifiedMods.data.link ?
            `<a class="txU noWrap" href="${app.verifiedMods.data.link}" data-open-external>` +
              `${app.polyglot.t('verifiedMod.modVerified.link')}</a>` :
            '',
        }) :
        app.polyglot.t('verifiedMod.modUnverified.tipBody', {
          name: `<b>${app.verifiedMods.data.name}</b>`,
          not: `<b>${app.polyglot.t('verifiedMod.modUnverified.not')}</b>`,
        }),
    },
  };
}
