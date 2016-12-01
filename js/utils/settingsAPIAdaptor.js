

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


*/
