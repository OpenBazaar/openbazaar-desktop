import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    if (!options.url) {
      throw new Error('Please provide the url which the user is attempting to navigate to.');
    }

    super(opts);
    this.url = opts.url;
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
    this.trigger('cancelClick');
  }

  onConfirmClick() {
    this.trigger('confirmClick');
  }

  close(...args) {
    if (this.getCachedEl('#dontShowTorExternalLinkWarning').is(':checked')) {
      app.localSettings.save('dontShowTorExternalLinkWarning', true);
    }

    super.close(...args);
  }

  render() {
    loadTemplate('modals/torExternalLinkWarning.html', t => {
      this.$el.html(t({
        url: this.url,
      }));

      super.render();
    });

    return this;
  }
}
