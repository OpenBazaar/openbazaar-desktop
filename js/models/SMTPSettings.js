import BaseModel from './BaseModel';
import app from '../app';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      notifications: false,
      serverAddress: 'defaultserveraddress',
      username: '',
      password: '',
      senderEmail: '',
      recipientEmail: ''
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if ( attrs.notifications ) { 
      if ( is.not.url( attrs.serverAddress.trim() ) )
        addError( 'serverAddress', app.polyglot.t( 'smtpModelErrors.serverAddress' ) );
      if ( is.not.alphaNumeric( attrs.username.trim() ) || is.empty( attrs.username.trim() ) )
        addError( 'username', app.polyglot.t( 'smtpModelErrors.username' ) );
      if ( is.empty( attrs.password.trim() ) )
        addError( 'password', app.polyglot.t( 'smtpModelErrors.password' ) );
      if ( is.not.email( attrs.senderEmail.trim() ) )
        addError( 'senderEmail', app.polyglot.t( 'smtpModelErrors.senderEmail' ) );
      if ( is.not.email( attrs.recipientEmail.trim() ) )
        addError( 'recipientEmail', app.polyglot.t( 'smtpModelErrors.recipientEmail' ) );
    }

    if (Object.keys(errObj).length) {
      return errObj;
    }

    return undefined;
  }
}
