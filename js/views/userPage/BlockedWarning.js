import { unblock } from '../../utils/block';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from '../modals/BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      showCloseButton: false,
      ...options,
    };

    if (typeof options.peerId !== 'string') {
      throw new Error('Please provide the peerId of the blocked user as a string.');
    }

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-btnUnblock': 'onUnblockClick',
      ...super.events(),
    };
  }

  onCancelClick() {
    this.close();
    this.trigger('canceled');
  }

  onUnblockClick() {
    this.close();
    unblock(this.options.peerId);
  }

  render() {
    loadTemplate('userPage/blockedWarning.html', t => {
      this.$el.html(t({}));
      super.render();
    });

    return this;
  }
}
