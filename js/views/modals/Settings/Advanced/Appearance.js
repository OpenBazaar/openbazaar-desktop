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
    const mySettings = this.settings.toModelFormatJSON().appearanceSettings;

    if ( mySettings.windowControlStyle == 'mac' )
      app.localSettings.set( { 'macStyleWinControls' : true } );
    else
      app.localSettings.set( { 'macStyleWinControls' : false } );

    loadTemplate('modals/settings/advanced/appearance.html', (t) => {
      this.$el.html(t({
        errors : {},
        ...mySettings
      }));

      this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}
