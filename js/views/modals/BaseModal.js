import _ from 'underscore';
import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import { getHtml, getAppFrame } from '../../utils/selectors';

export default class BaseModal extends BaseVw {
  constructor(options = {}) {
    const opts = {
      dismissOnOverlayClick: true,
      dismissOnEscPress: true,
      showCloseButton: true,
      closeButtonClass: 'modalClose ion-close-round',
      modelContentClass: 'modalContent clrP',
      removeOnClose: false,
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

  __modalClick(e) {
    if (this.__options.dismissOnOverlayClick && e.target === this.el) {
      this.close();
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
    }

    return this;
  }

  close() {
    let modalIndex;

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

    this.__options = { ...this.__options, ...options };

    if (typeof options.showCloseButton !== 'undefined') {
      this.$modalClose[options.showCloseButton ? 'removeClass' : 'addClass']('hide');
    }

    return this;
  }

  getModalOptions() {
    return this.__options;
  }

  remove() {
    if (this.isOpen()) this.close();
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

    return this;
  }
}

BaseModal.__onDocKeypress = (e) => {
  const topModal = BaseModal.__openModals[BaseModal.__openModals.length - 1];

  if (e.keyCode === 27 && topModal &&
      topModal.__options.dismissOnEscPress) {
    topModal.close();
  }
};
