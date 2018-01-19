import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from '../modals/BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      showCloseButton: false,
      dismissOnEscPress: false,
      ...options,
    };

    super(opts);
    this.listenTo(app.settings, 'change:showNsfw', this.onChangeNsfw);
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-btnProceed': 'onProceedClick',
      ...super.events(),
    };
  }

  onCancelClick() {
    this.trigger('canceled');
    this.close();
  }

  onChangeNsfw(md, showNsfw) {
    if (showNsfw) this.close();
  }

  onProceedClick() {
    if (this.getCachedEl('.js-checkboxNsfw').is(':checked')) {
      this.stopListening(app.settings, null, this.onChangeNsfw);
      app.settings.set('showNsfw', true);
      $.ajax({
        type: 'PATCH',
        url: app.getServerUrl('ob/settings/'),
        data: JSON.stringify({ showNsfw: true }),
        dataType: 'json',
      });
    }

    this.close();
  }

  render() {
    loadTemplate('modals/nsfwWarning.html', t => {
      this.$el.html(t({}));
      super.render();
    });

    return this;
  }
}
