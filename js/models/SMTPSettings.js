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

    if ( is.not.url( attrs.serverAddress.trim() ) )
      addError( 'ServerAddress', app.polyglot.t( 'SMTPModelErrors.ServerAddress' ) );
    if ( is.not.alphanumeric( attrs.username.trim() ) || is.empty( attrs.username.trim() ) )
      addError( 'Username', app.polyglot.t( 'SMTPModelErrors.Username' ) );
    if ( is.empty( attrs.password.trim() ) )
      addError( 'Password', app.polyglot.t( 'SMTPModelErrors.Password' ) );
    if ( is.not.email( attrs.senderEmail.trim() ) )
      addError( 'SenderEmail', app.polyglot.t( 'SMTPModelErrors.SenderEmail' ) );
    if ( is.not.email( attrs.recipientEmail.trim() ) )
      addError( 'RecipientEmail', app.polyglot.t( 'SMTPModelErrors.RecipientEmail' ) );

    if (Object.keys(errObj).length) {
      console.warn( errObj );
      return errObj;
    }

    return undefined;
  }
}
