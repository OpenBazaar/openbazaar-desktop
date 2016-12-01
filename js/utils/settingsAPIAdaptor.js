/*

  This is an adaptor between the settings model and the settings API.

  === Settings API Format === 
  
    Current as of: https://github.com/OpenBazaar/openbazaar-go/commit/3b4d7386669b7b5a1f99e90623ecd72f3224ba28

    The settings API currently returns for the models to parse in the following format:

    {
      "paymentDataInQR": false,
      "showNotificatons": null,
      "showNsfw": true,
      "shippingAddresses": [],
      "localCurrency": "USD",
      "country": "UNITED_STATES",
      "language": "en-US",
      "termsAndConditions": "",
      "refundPolicy": "",
      "blockedNodes": [],
      "storeModerators": [],
      "smtpSettings": {
        "notifications": true,
        "serverAddress": "",
        "username": "",
        "password": "",
        "senderEmail": "",
        "recipientEmail": ""
      }
    }

  === Settings Model toJSON Format ===

    Current as of: https://github.com/tenthhuman/openbazaar-desktop/commit/deaaddfc3c1903b68100846651e98d499968c285

    While the settings API currently produces a JSON object in this form:

    {
      "paymentDataInQR": false,
      "showNotifications": true,
      "showNsfw": true,
      "localCurrency": "USD",
      "country": "UNITED_STATES",
      "language": "en-US",
      "termsAndConditions": "",
      "refundPolicy": "",
      "blockedNodes": [],
      "storeModerators": [],
      "shippingAddresses": [],
      "appearanceSettings": {
        "showAdvancedVisualEffects": true,
        "windowControlStyle": "mac"
      },
      "transactionSettings": {
        "saveTransactionMetadata": true,
        "defaultFee": "high"
      },
      "serverSettings": {
        "currentFirewallType": "none"
      },
      "smtpIntegrationSettings": {
        "smtpNotifications": false,
        "smtpServerAddress": "",
        "smtpUserName": "",
        "smtpPassword": "",
        "smtpFromEmail": "",
        "smtpToEmail": ""
      },
      "showNotificatons": null,
      "smtpSettings": {
        "notifications": true,
        "serverAddress": "",
        "username": "",
        "password": "",
        "senderEmail": "",
        "recipientEmail": ""
      }
    }

  === What's the difference? ===

  The current settings API produces an object which has a spelling error in 1 key:

  'showNotificatons' works to be 'showNotifications'

  Apart from that the only difference between the 
  settings model format and the
  settings API format is that the
  settings model format contains 4 new keys, namely:

  smtpIntegrationSettings,
  appearanceSettings,
  transactionSettings,
  serverSettings

  Of these 1 key, 'smtpIntegrationSettings', is substantially similar
  to an existing key, 'smtpSettings'. 

  So the proposal for the adaptor is:

  - convert smtpIntegrationSettings to smtpSettings format.
  - convert showNotifications to showNotificaton

  And the proposal for the requests API changes are:

  request spelling correction to showNotifications
  request 3 new keys be added, namely:

  appearanceSettings,
  transactionSettings,
  serverSettings

  That is all.

*/


class Adaptor {
  static makeConverter( source, conversions ) {
    return function converter( destination, key ) { 
      const value = source[ key ];
      if ( conversions[ key ] instanceof Function ) {
        const converted = conversions[ key ]( key, value );
        destination[ converted.key ] = converted.value;
      } else
        destination[ key ] = value;

        
      return destination;
    };
  }
}

export default class SettingsAPIAdaptor extends Adaptor { 
  static convertModelToAPIFormat( toJSONOutput ) {
    const apiFormat = Object.create( null );
    const keyConversions = Object.assign( Object.create( null ), {
      showNotifications : reproduceSpellingError,
      smtpIntegrationSettings : convertToAPIFormatForSMTPSettings
    });

    Object.keys( toJSONOutput ).reduce( this.makeConverter( toJSONOutput, keyConversions ), apiFormat );

    return apiFormat;
  }

  static convertAPIToModelFormat( apiResponse ) {
    const modelFormat = Object.create( null );
    const keyConversions = Object.assign( Object.create( null ), {
      showNotificatons : correctSpellingError,
      smtpSettings : convertFromAPIFormatForSMTPSettings
    });
    Object.keys( apiResponse ).reduce( this.makeConverter( apiResponse, keyConversions ), modelFormat );

    return modelFormat;
  }
}

// helpers

  function reproduceSpellingError( key, value ) {
    return { key : 'showNotificatons', value };
  }

  function correctSpellingError( key, value ) {
    return { key : 'showNotifications', value };
  }

  function convertToAPIFormatForSMTPSettings( key, value ) {
    return {
      key : 'smtpSettings', 
      value : {
        notifications : value.smtpNotifications,
        username : value.smtpUserName,
        password : value.smtpPassword,
        senderEmail : value.smtpFromEmail,
        recipientEmail : value.smtpToEmail
      }
    };
  }

  function convertFromAPIFormatForSMTPSettings( key, value ) {
    return {
      key : 'smtpIntegrationSettings',
      value : {
        smtpNotifications : value.notifications,
        smtpUserName : value.username,
        smtpPassword : value.password,
        smtpFromEmail : value.senderEmail,
        smtpToEmail : value.recipientEmail
      }
    };
  }

