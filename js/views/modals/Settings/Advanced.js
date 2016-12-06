import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options,
    });

    this.settings = app.settings.clone( );

    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toJSON()));
  }

  get events() {
    return {
      'change input[name="appearanceSettings.windowControlStyle"]': 'changedWindowStyle'
    };
  }

  changedWindowStyle( event ) {
    if ( event.target.id == 'windowControlStyleMac' ) 
      app.localSettings.set('macStyleWinControls', true ); 
    else
      app.localSettings.set('macStyleWinControls', false ); 
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  save() {
    const formData = this.getFormData();

    this.settings.set(formData);

    const save = this.settings.save();

    this.trigger('saving');

    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      save
        .done(() => {
          this.trigger('saveComplete');
        })
        .fail((...args) => {
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
        });
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  render() {
    loadTemplate('modals/settings/advanced.html', (t) => {
      this.$el.html(t({
        errors: this.settings.validationError || {},
        ...this.settings.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');
    });

    return this;
  }
}

