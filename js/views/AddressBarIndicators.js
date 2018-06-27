import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';
import { isMultihash } from '../utils';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      hide: true,
      ...options.initialState || {},
    };
  }

  className() {
    return 'addressBarIndicators';
  }

  updateVisibility(addressBarText) {
    if (typeof addressBarText !== 'string') {
      throw new Error('Please provide a valid address bar as string.');
    }

    const viewOnWebState = {
      hide: true,
    };

    const urlParts = this.getUrlParts(addressBarText);

    if (urlParts.length > 1 && isMultihash(urlParts[0])) {
      const supportedPages = ['store', 'home', 'followers', 'following'];
      const currentPage = urlParts[1];

      if (supportedPages.includes(currentPage)) {
        const obDotCom = 'http://openbazaar.com';
        const peerID = urlParts[0];

        if (currentPage === 'store') {
          // app: '/peerID/store/' => web: '/store/peerID/'
          viewOnWebState.url = `${obDotCom}/store/${peerID}`;

          if (urlParts.length === 3) {
            // app: '/peerID/store/slug' => web: '/store/peerID/slug'
            const slug = urlParts[2];
            viewOnWebState.url = `${viewOnWebState.url}/${slug}`;
          }
        } else {
          // app: '/peerID/(home|followers|following)' =>
          // web: '/store/(home|followers|following)/peerID'
          viewOnWebState.url = `${obDotCom}/store/${currentPage}/${peerID}`;
        }
      }
    }

    viewOnWebState.hide = !viewOnWebState.url;

    this.setState(viewOnWebState);
  }

  updatePointerVisibility() {
    if (this.getState().hide) {
      this.$el.addClass('hidePointer');
    } else {
      this.$el.removeClass('hidePointer');
    }
  }

  getUrlParts(url) {
    if (typeof url !== 'string') {
      throw new Error('Please provide a valid url as a string.');
    }

    const urlParts = url.startsWith('ob://') ?
      url.slice(5)
      .split(' ')[0] :
      url.split(' ')[0];

    return urlParts.split('/');
  }

  render() {
    super.render();

    this.updatePointerVisibility();

    loadTemplate('addressBarIndicators.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
