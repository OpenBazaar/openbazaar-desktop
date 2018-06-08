import _ from 'underscore';
import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';
import { isMultihash } from '../utils';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      hide: true,
      url: '',
      ...options.initialState || {},
    };
  }

  updateVisibilityBasedOn(addressBarText) {
    if (typeof addressBarText !== 'string') {
      throw new Error('Please provide a valid address bar as string.');
    }

    const obDotCom = 'http://openbazaar.com';

    // Reset the state
    let viewOnWebState = {
      hide: true,
      url: '',
    };

    // TODO: Break this out into the AddressBarIndicator.js
    const firstTerm = addressBarText.startsWith('ob://') ?
    addressBarText.slice(5)
      .split(' ')[0]
      .split('/')[0] :
      addressBarText.split(' ')[0]
      .split('/')[0];

    if (isMultihash(firstTerm)) {
      const peerID = firstTerm;
      const parts = addressBarText.slice(5).split('/');

      const pages = ['store', 'home', 'followers', 'following'];
      const page = parts[1];

      if (pages.includes(page)) {
        let url = `${obDotCom}/${peerID}/${page}`;

        if (page === 'store' && parts.length === 3) {
          const slug = parts[2];
          url += `/${slug}`;
        }
        viewOnWebState = {
          hide: false,
          url,
        };
      } else {
        viewOnWebState = {
          hide: true,
          url: '',
        };
      }
    }

    this.setState(viewOnWebState);
  }

  className() {
    return '.addressBarIndicators';
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
    loadTemplate('addressBarIndicators.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
