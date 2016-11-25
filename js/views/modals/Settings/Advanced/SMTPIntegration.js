import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';

export default class extends baseVw {
  constructor( options = { } ) {
    super( options );

    this.options = options;
  }

  render( ) {
    loadTemplate('modals/settings/advanced/smtpintegration.html', (t) => {
      this.$el.html(t({
        // FIXME : implement
        errors : {},
        ...this.options
      }));
    });

    return this;
  }
}
