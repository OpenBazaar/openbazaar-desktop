import app from '../../../../app';
import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';

export default class extends baseVw {
  constructor( options = { } ) {
    super( options );

    this.options = options;
    this.settings = app.settings.clone( );
  }

  getFormData( ) {
    return super.getFormData( this.$formFields );
  }

  render( ) {
    this.settings = app.settings.clone( );
    loadTemplate('modals/settings/advanced/smtpintegration.html', (t) => {
      this.$el.html(t({
        errors : this.model.validationError || {},
        ...this.settings.toModelFormatJSON().smtpIntegrationSettings
      }));

      this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}
