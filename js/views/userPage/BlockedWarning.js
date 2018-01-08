import loadTemplate from '../../utils/loadTemplate';
import BaseModal from '../modals/BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-confirm': 'onConfirmClick',
      ...super.events(),
    };
  }

  onCancelClick() {
    this.close();
  }

  onConfirmClick() {
    this.trigger('confirmClick');
  }

  render() {
    loadTemplate('userPage/blockedWarning.html', t => {
      this.$el.html(t({}));
      super.render();
    });

    return this;
  }
}
