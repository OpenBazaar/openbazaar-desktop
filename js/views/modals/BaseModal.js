import _ from 'underscore';
import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import { getHtml, getAppFrame } from '../../utils/selectors';

export default class BaseModal extends BaseVw {
  // initialOptions() {
  //   return {
  //     dismissOnOverlayClick: true,
  //     dismissOnEscPress: true,
  //     showCloseButton: true,
  //     closeButtonClass: 'btn-corner btn-cornerTR btn-cornerTROutR btn-flushTop',
  //     // This will be concatenated to the className of your view which extends
  //     // baseModal. You really shouldn't have to use this option, unless you
  //     // don't want 'modal-opaque' (i.e. remove 'modal' at your own risk!)
  //     baseModalClass: 'modal modal-opaque',
  //     innerWrapperClass: 'modal-child modal-childMain custCol-primary custCol-text'
  //   };
  // }

  constructor(options = {}) {
    console.log(`filbert ${options.className}`);
    super({
      dismissOnOverlayClick: true,
      dismissOnEscPress: true,
      showCloseButton: true,
      closeButtonClass: 'btn-corner btn-cornerTR btn-cornerTROutR btn-flushTop',
      // This will be concatenated to the className of your view which extends
      // baseModal. You really shouldn't have to use this option, unless you
      // don't want 'modal-opaque' (i.e. remove 'modal' at your own risk!)
      baseModalClass: 'modal modal-opaque',
      innerWrapperClass: 'modal-child modal-childMain custCol-primary custCol-text',
      ...options,
    });

    this.__options = options;
    console.log('chuck the duck');
    this._open = false;

    // _.bindAll(this, '__onDocKeypress');

    if (typeof BaseModal.__openModals === 'undefined') {
      BaseModal.__openModals = [];
    }

    if (!BaseModal.__docKeyPressHandlerBound) {
      $(document).on('keyup', BaseModal.__onDocKeypress);
      BaseModal.__docKeyPressHandlerBound = true;
    }
  }

  className() {
    console.log('slippy');
    return `${this.__options.baseModalClass} ${_.result(this, 'className', '')} ` +
      `${this.__options.className || ''}`;
  }

  events() {
    // const events = _.result(this, 'events', {});
    console.log('hello');
    console.log(JSON.stringify(this.events));

    return {
      click: '__modalClick',
      'click .js-modal-close': '__closeClick',
    };
  }

  // __onDocKeypress(e) {
  //   var topModal = this.__getTopModal();

  //   if (this.__options.dismissOnEscPress && e.keyCode === 27 &&
  //     topModal && topModal === this) {
  //     this.close();
  //   }
  // },

  __modalClick(e) {
    if (this.__options.dismissOnOverlayClick && e.target === this.el) {
      this.close();
    }
  }

  __closeClick() {
    this.close();
  }

  // __getTopModal: function() {
  //   var openModals = baseModal.__openModals.slice();

  //   openModals = openModals.map((modal, i) => {
  //     return { modal: modal, index: i };
  //   });

  //   openModals = openModals.sort((a, b) => {
  //     var aZindex = parseInt(window.getComputedStyle(a.modal.el).zIndex) || 0,
  //         bZindex = parseInt(window.getComputedStyle(b.modal.el).zIndex) || 0;

  //     if (aZindex === bZindex) {
  //       return (a.index < b.index) ? -1 : (a.index > b.index) ? 1 : 0;
  //     }
  //     return (aZindex < bZindex) ? -1 : (aZindex > bZindex) ? 1 : 0;
  //   });

  //   return openModals[openModals.length - 1] && openModals[openModals.length - 1].modal;
  // },

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
      getAppFrame().removeChild(this.el);
      this._open = false;
      this.trigger('close');
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
    loadTemplate('./js/templates/baseModal.html', (t) => {
      this.$el.html(t(
        _.extend({}, this.__options, { innerContent: self.el.innerHTML }))
      );
    });

    this.$modalClose = this.$('.js-modal-close');

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
