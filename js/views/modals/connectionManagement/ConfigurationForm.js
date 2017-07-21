import app from '../../../app';
import openSimpleMessage from '../SimpleMessage';
import { getCurrentConnection } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!opts.model) {
      throw new Error('Please provide a model.');
    }

    const curConn = getCurrentConnection();
    this.showConfigureTorMessage = false;
    this.showTorUnavailableMessage = false;

    if (curConn && curConn.server && curConn.server.id === options.model.id) {
      if (curConn.reason === 'tor-not-configured') {
        this.showConfigureTorMessage = true;
      } else if (curConn.reason === 'tor-not-available') {
        this.showTorUnavailableMessage = true;
      }
    }

    this._lastSavedAttrs = this.model.toJSON();

    this.title = this.model.isNew() ?
      app.polyglot.t('connectionManagement.configurationForm.tabName') :
      this.model.get('name');

    this.listenTo(this.model, 'change:name', () => {
      const newName = this.model.get('name');
      if (newName) this.title = newName;
    });
  }

  className() {
    return 'configurationForm';
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-save': 'onSaveClick',
      'change #serverConfigServerIp': 'onChangeServerIp',
      'change [name=useTor]': 'onChangeUseTor',
    };
  }

  onCancelClick() {
    this.trigger('cancel', { view: this });
  }

  onSaveClick() {
    const formData = this.getFormData(this.$formFields);
    this.model.set({
      ...this.getFormData(this.$formFields),
      confirmedTor: this.model.get('confirmedTor') || formData.useTor ||
        this.showConfigureTorMessage,
    });
    const save = this.model.save();

    if (save) {
      save.done(() => {
        this._lastSavedAttrs = this.model.toJSON();
        this.trigger('saved', { view: this });
      }).fail(() => {
        // since we're saving to localStorage this really shouldn't happen
        openSimpleMessage('Unable to save server configuration');
      });
    }

    this.render();
  }

  onChangeServerIp(e) {
    if (['localhost', '127.0.0.1'].indexOf(e.target.value) !== -1) {
      // it's a local ip
      this.$usernameLabel.add(this.$passwordLabel)
        .removeClass('required');
      this.$btnStripSsl.removeClass('disabled');
    } else {
      this.$usernameLabel.add(this.$passwordLabel)
        .addClass('required');
      this.$radioSslOn[0].checked = true;
      this.$btnStripSsl.addClass('disabled');
    }
  }

  onChangeUseTor(e) {
    this.getCachedEl('.js-torProxyRow')
      .toggleClass('hide', !e.target.checked);
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$('select[name], input[name], textarea[name]'));
  }

  get $usernameLabel() {
    return this._$usernameLabel ||
      (this._$usernameLabel = this.$('.js-usernameLabel'));
  }

  get $passwordLabel() {
    return this._$passwordLabel ||
      (this._$passwordLabel = this.$('.js-passwordLabel'));
  }

  get $radioSslOn() {
    return this._$radioSslOn ||
      (this._$radioSslOn = this.$('#serverConfigSSLOn'));
  }

  get $btnStripSsl() {
    return this._$btnStripSsl ||
      (this._$btnStripSsl = this.$('.js-btnStripSsl'));
  }

  render() {
    super.render();
    loadTemplate('modals/connectionManagement/configurationForm.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        isRemote: !this.model.isLocalServer(),
        title: this.title,
        showConfigureTorMessage: this.showConfigureTorMessage,
        showTorUnavailableMessage: this.showTorUnavailableMessage,
      }));

      this._$formFields = null;
      this._$usernameLabel = null;
      this._$passwordLabel = null;
      this._$radioSslOn = null;
      this._$btnStripSsl = null;

      if (!this.rendered) {
        this.rendered = true;
        setTimeout(() => {
          if (!this.showConfigureTorMessage && !this.showTorUnavailableMessage) {
            this.getCachedEl('.js-inputName').focus();
          }
        });
      }
    });

    return this;
  }
}
