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
        textClass: 'txB tx5b',
        textWrapperClass: 'flexVCent gutterHTn',
        infoIconClass: 'ion-information-circled clrT2',
        tipTitle: options.initialState &&
          typeof options.initialState.tipTitle === 'undefined' &&
          options.initialState.text || '',
        tipTitleClass: 'tx4 txB',
        titleWrapperClass: 'flexCent rowSm gutterHTn',
        tipBody: '',
        tipBodyClass: '',
        arrowClass: 'arrowBoxCenteredTop',
        badgeUrl: '',
        wrapInfoIcon: options.initialState &&
          options.initialState.text || false,
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

function getBaseOptions(options = {}) {
  const opts = {
    shortText: true,
    shortTipTitle: false,
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

  const tipTitleKey = opts.shortTipTitle ?
    'titleShort' : 'titleLong';

  return {
    badge: opts.model &&
      opts.model.get('type').badge || undefined,
    initialState: {
      verified: opts.verified,
      text: opts.verified ?
        app.polyglot.t(`verifiedMod.modVerified.${textKey}`) :
        app.polyglot.t(`verifiedMod.modUnverified.${textKey}`),
      tipTitle: opts.verified ?
        app.polyglot.t(`verifiedMod.modVerified.${tipTitleKey}`) :
        app.polyglot.t(`verifiedMod.modUnverified.${tipTitleKey}`),
    },
  };
}

export function getModeratorOptions(options = {}) {
  const opts = {
    verified: !!options.model,
    ...options,
  };

  const baseOptions = getBaseOptions(options);

  return {
    ...baseOptions,
    initialState: {
      ...baseOptions.initialState,
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

export function getListingOptions(options = {}) {
  const opts = {
    verified: !!options.model,
    ...options,
  };

  const baseOptions = getBaseOptions(options);

  return {
    ...baseOptions,
    initialState: {
      ...baseOptions.initialState,
      text: '',
      tipBody: opts.verified ?
        app.polyglot.t('verifiedMod.listingVerified.tipBody', {
          name: `<b>${app.verifiedMods.data.name}</b>`,
          link: app.verifiedMods.data.link ?
            `<a class="txU noWrap" href="${app.verifiedMods.data.link}" data-open-external>` +
              `${app.polyglot.t('verifiedMod.listingVerified.link')}</a>` :
            '',
        }) :
        app.polyglot.t('verifiedMod.listingUnverified.tipBody', {
          name: `<b>${app.verifiedMods.data.name}</b>`,
          not: `<b>${app.polyglot.t('verifiedMod.listingUnverified.not')}</b>`,
        }),
    },
  };
}
