import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      smtpNotifications: false,
      smtpServerAddress: 'defaultservername',
      smtpUserName: '',
      smtpPassword: '',
      smtpFromEmail: '',
      smtpToEmail: ''
    };
  }
}
