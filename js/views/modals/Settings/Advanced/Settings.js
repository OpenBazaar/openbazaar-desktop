import app from '../../../../app';
import loadTemplate from '../../../../utils/loadTemplate';
import baseVw from '../../../baseVw';
import Appearance from './Appearance';
import Transactions from './Transactions';
import Server from './Server';
import SMTPIntegration from './SMTPIntegration';
import AppearanceSettings from '../../../../models/AppearanceSettings';
import TransactionSettings from '../../../../models/TransactionSettings';
import ServerSettings from '../../../../models/ServerSettings';
import SMTPIntegrationSettings from '../../../../models/SMTPIntegrationSettings';

export default class Advanced extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options
    });

    this.options = options;
    this.settings = app.settings.clone( );


    self.app = app;

    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toModelFormatJSON()));
    this.listenTo(this.settings, 'save', () => app.settings.set(this.settings.toModelFormatJSON()));

    this.appearanceSettings = this.createChild( Appearance, { 
      model : new AppearanceSettings( ) 
    } );
    this.transactionSettings = this.createChild( Transactions, { 
      model : new TransactionSettings( ) 
    } );
    this.serverSettings = this.createChild( Server, { 
      model : new ServerSettings( ) 
    } );
    this.smtpIntegrationSettings = this.createChild( SMTPIntegration, { 
      model : new SMTPIntegrationSettings( ) 
    } );
  }

  getFormData() {
    const data = {
      appearanceSettings : this.appearanceSettings.getFormData( ),
      transactionSettings : this.transactionSettings.getFormData( ),
      serverSettings : this.serverSettings.getFormData( ),
      smtpIntegrationSettings : this.smtpIntegrationSettings.getFormData( ),
    };

    return data;
  }

  save() {
    const formData = this.getFormData();

    this.settings.set(formData);
    app.settings.set( this.settings.toJSON( ) );

    const save = this.settings.save( );
    this.trigger('saving');
    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      save.
        done(() => { 
          this.trigger('saveComplete');
          this.render();
        })
        .fail((...args) => {
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
          this.render();
        });
    }
  }

  render() {
    loadTemplate('modals/settings/advanced/settings.html', (t) => {
      this.$el.html(t({
        errors : {}
      }));

      this.$('.js-appearanceContainer').html(
        this.appearanceSettings.render().el
      );

      this.$('.js-transactionsContainer').html(
        this.transactionSettings.render().el
      );

      this.$('.js-serverContainer').html(
        this.serverSettings.render().el
      );

      this.$('.js-smtpIntegationContainer').html(
        this.smtpIntegrationSettings.render().el
      );

      this.$formFields = this.$('select[name], input[name]');
    });
    
    return this;
  }
}
