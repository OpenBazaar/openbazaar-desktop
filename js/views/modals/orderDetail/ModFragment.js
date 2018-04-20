import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import VerifiedMod from '../../components/VerifiedMod';
import app from '../../../app';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this._state = {
      maxPeerIdLength: 8,
      showAvatar: false,
      ...options.initialState || {},
    };

    this.verifiedModModel = app.verifiedMods.get(this._state.peerID);

    this.listenTo(app.verifiedMods, 'update', () => {
      const newVerifiedModModel = app.verifiedMods.get(this._state.peerID);
      if (newVerifiedModModel !== this.verifiedModModel) {
        this.verifiedModModel = newVerifiedModModel;
        this.render();
      }
    });
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    super.render();

    loadTemplate('modals/orderDetail/modFragment.html', t => {
      this.$el.html(t({
        ...this._state,
      }));

      if (this.verifiedMod) this.verifiedMod.remove();
      this.verifiedMod = this.createChild(VerifiedMod, {
        model: this.verifiedModModel,
        data: app.verifiedMods.data,
        showShortText: true,
        inOrder: true,
      });
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
    });

    return this;
  }
}
