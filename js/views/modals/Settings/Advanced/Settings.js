import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';
import Appearance from './Appearance';
import Transactions from './Transactions';
import Server from './Server';
import SMTPIntegration from './SMTPIntegration';

export default class Advanced extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options
    });

    this.options = options;

    this.appearanceSettings = this.createChild( Appearance, { } );
    this.transactionsSettings = this.createChild( Transactions, { } );
    this.serverSettings = this.createChild( Server, { } );
    this.smtpIntegationSettings = this.createChild( SMTPIntegration, { } );
    
    // FIXME : implement
  }

  getFormData() {
    // FIXME : implement
  }

  save() {
    // FIXME : implement
  }

  render() {
    loadTemplate('modals/settings/advanced/settings.html', (t) => {
      this.$el.html(t({
        // FIXME : implement
        errors : {},
        ...this.options
      }));

      this.$('.js-appearanceContainer').html(
        this.appearanceSettings.render().el
      );

      this.$('.js-transactionsContainer').html(
        this.transactionsSettings.render().el
      );

      this.$('.js-serverContainer').html(
        this.serverSettings.render().el
      );

      this.$('.js-smtpIntegationContainer').html(
        this.smtpIntegationSettings.render().el
      );

      super.render();
      // FIXME : implement
    });
    
    return this;
  }
}
