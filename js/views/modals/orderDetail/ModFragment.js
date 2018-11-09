import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import VerifiedMod, { getModeratorOptions } from '../../components/VerifiedMod';
import app from '../../../app';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        maxPeerIdLength: 8,
        showAvatar: false,
        ...options.initialState,
      },
    });

    this.options = options;
    const state = this.getState();

    this.verifiedModModel = app.verifiedMods.get(state.peerID);

    this.listenTo(app.verifiedMods, 'update', () => {
      const newVerifiedModModel = app.verifiedMods.get(state.peerID);
      if (newVerifiedModModel !== this.verifiedModModel) {
        this.verifiedModModel = newVerifiedModModel;
        this.render();
      }
    });
  }

  render() {
    super.render();
    const state = this.getState();

    loadTemplate('modals/orderDetail/modFragment.html', t => {
      this.$el.html(t({
        ...state,
      }));

      const verifiedMod = app.verifiedMods.get(state.peerID);
      const createOptions = getModeratorOptions({
        model: verifiedMod,
      });

      if (!verifiedMod) {
        createOptions.initialState.tipBody =
          app.polyglot.t('verifiedMod.modUnverified.tipBodyOrderDetail', {
            not: `<b>${app.polyglot.t('verifiedMod.modUnverified.not')}</b>`,
            name: `<b>${app.verifiedMods.data.name}</b>`,
          });
      }

      if (this.verifiedMod) this.verifiedMod.remove();
      this.verifiedMod = this.createChild(VerifiedMod, createOptions);
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
    });

    return this;
  }
}
