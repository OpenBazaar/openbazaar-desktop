import _ from 'underscore';
import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import { getHtml, getAppFrame } from '../../utils/selectors';
import { isPromise } from '../../utils/object';
import app from '../../app';

export default class BaseModal extends baseVw {
  constructor(options = {}) {
    const opts = {
      // #259 - we've decided not have modals close on an overlay click, so you
      // probably should never be passing in true for this.
      dismissOnOverlayClick: false,
      dismissOnEscPress: true,
      showCloseButton: true,
      closeButtonClass: 'cornerTR iconBtn clrP clrBr clrSh3 toolTipNoWrap modalCloseBtn',
      innerButtonClass: 'ion-ios-close-empty',
      closeButtonTip: app.polyglot.t('pageNav.toolTip.close'),
      modelContentClass: 'modalContent',
      removeOnClose: false,
      removeOnRoute: true,
      ...options,
    };

    super(opts);

    this.__options = opts;
    this._open = false;

    if (typeof BaseModal.__openModals === 'undefined') {
      BaseModal.__openModals = [];
    }

    if (!BaseModal.__docKeyPressHandlerBound) {
      $(document).on('keyup', BaseModal.__onDocKeypress);
      BaseModal.__docKeyPressHandlerBound = true;
    }

    if (this.__options.removeOnRoute) this.listenTo(app.router, 'will-route', this.remove);
  }

  className() {
    return 'modal';
  }

  events() {
    return {
      click: '__modalClick',
      'click .jsModalClose': '__closeClick',
    };
  }

  /**
   * Returns an array of HTMLElements and if any of these are directly clicked the modal
   * will be closed. By default, the only target will be this.el, which means any clicks
   * outside of the modal will close it. But... with the new modal design where everything
   * is in boxes, the waters are muddied because the overlay is visible inbetween boxes
   * and you may want a click on those regions to close the modal (e.g. left navigation
   * is much shorter than the right content exposing a large amount of the overlay).
   *
   * Anyhow, since the content inside a modal is very specific to the modal, it is up to
   * the specific child view to let this base view know what qualifies as a close target.
   * That should be done by overriding this method. You will very likely want to include
   * a call to super in the array you are returning, e.g:
   *
   *     return [myCustomEl, myCustomEl2, ...super.closeClickTargets];
   *
   * Also, the overridden method will be called on EVERY click in this modal, so it is
   * critical you are caching the elements returned (i.e. DO NOT go to the DOM every time
   * the method is called).
   */
  get closeClickTargets() {
    return [this.el];
  }

  __modalClick(e) {
    if (this.__options.dismissOnOverlayClick) {
      const closeTargets = this.closeClickTargets;

      if (!(_.isArray(closeTargets))) {
        throw new Error('closeClickTargets must return an array.');
      }

      if (closeTargets.indexOf(e.target) !== -1) this.close();
    }
  }

  __closeClick() {
    this.close();
  }

  isOpen() {
    return this._open;
  }

  open() {
    if (!$.contains(document, this.el)) {
      getHtml().addClass('modalOpen');
      getAppFrame().append(this.el);
      BaseModal.__openModals.push(this);
      this._open = true;
      this.trigger('open');
    } else {
      this.bringToTop();
    }

    return this;
  }

  close(bypassConfirmation = false) {
    let modalIndex;

    // Unless bypassConfirmation is true, if you implement a confirmClose function
    // in your modal, it will be called before potentially closing. If it returns a promise,
    // the modal will close when the promise resolves. If it returns a truthy (other than a
    // promise) the modal will close immediately.
    //
    // If you are returning a Promise, you almost certainly want to show some type of dialog
    // to indicate that something is happening (most likely a confirm close dialog).
    if (!bypassConfirmation && typeof this.confirmClose === 'function') {
      const closeConfirmed = this.confirmClose.call(this);
      if (isPromise(closeConfirmed)) {
        // Routing to a new page while the confirm close process is active could produce
        // weird things, so we'll block page navigation.
        app.pageNav.navigable = false;
        closeConfirmed.done(() => this.close(true))
          .always(() => (app.pageNav.navigable = true));
      } else {
        if (closeConfirmed) this.close(true);
      }

      return this;
    }

    if ($.contains(document, this.el)) {
      modalIndex = BaseModal.__openModals.indexOf(this);
      if (modalIndex >= 0) BaseModal.__openModals.splice(modalIndex, 1);
      if (!BaseModal.__openModals.length) getHtml().removeClass('modalOpen');
      getAppFrame()[0].removeChild(this.el);
      this._open = false;
      this.trigger('close');
    }

    if (this.__options.removeOnClose) {
      this.remove();
    }

    return this;
  }

  setModalOptions(options) {
    if (!options) return this;

    if (typeof options.showCloseButton !== 'undefined') {
      this.$modalClose[options.showCloseButton ? 'removeClass' : 'addClass']('hide');
    }

    if (typeof options.removeOnRoute !== 'undefined' &&
      options.removeOnRoute !== this.__options.removeOnRoute) {
      if (options.removeOnRoute) {
        this.listenTo(app.router, 'will-route', this.remove);
      } else {
        this.stopListening(app.router, 'will-route');
      }
    }

    this.__options = { ...this.__options, ...options };

    return this;
  }

  getModalOptions() {
    return this.__options;
  }

  bringToTop() {
    if (this.isOpen()) {
      getAppFrame()[0].removeChild(this.el);
      getAppFrame().append(this.el);
    }
  }

  remove() {
    this.trigger('modal-will-remove');
    if (this.isOpen()) this.close(true);
    super.remove();

    return this;
  }

  render() {
    loadTemplate('modals/baseModal.html', (t) => {
      this.$el.html(t(
        _.extend({}, this.__options, { innerContent: this.el.innerHTML }))
      );
    });

    this.$modalClose = this.$('.jsModalClose');

    return super.render();
  }
}

BaseModal.__onDocKeypress = (e) => {
  const topModal = BaseModal.__openModals[BaseModal.__openModals.length - 1];

  if (e.keyCode === 27 && topModal &&
      topModal.__options.dismissOnEscPress) {
    topModal.close();
  }
};

export function getOpenModals() {
  return BaseModal.__openModals || [];
}
