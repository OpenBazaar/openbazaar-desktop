import openSimpleMessage from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }
  }

  className() {
    return 'newConfiguration';
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-save': 'onSaveClick',
      'change #serverConfigServerIp': 'onChangeServerIp',
    };
  }

  onCancelClick() {
    this.trigger('cancel', { view: this });
  }

  onSaveClick() {
    this.model.set(this.getFormData(this.$formFields));

    const save = this.model.save();

    if (save) {
      save.done(() => this.trigger('saved', { view: this }))
        .fail(() => {
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
      // this.$btnStripSsl.removeClass('disabled');
    } else {
      this.$usernameLabel.add(this.$passwordLabel)
        .addClass('required');

      // Turning off for now pending documentation on how to set up SSL
      // on the server.
      // this.$radioSslOn[0].checked = true;
      // this.$btnStripSsl.addClass('disabled');
    }
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
    loadTemplate('modals/connectionManagement/configurationForm.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        isRemote: !this.model.isLocalServer(),
      }));

      this._$formFields = null;
      this._$usernameLabel = null;
      this._$passwordLabel = null;
      this._$radioSslOn = null;
      this._$btnStripSsl = null;

      if (!this.rendered) {
        this.rendered = true;
        setTimeout(() => this.$('.js-inputName').focus());
      }
    });

    return this;
  }
}
