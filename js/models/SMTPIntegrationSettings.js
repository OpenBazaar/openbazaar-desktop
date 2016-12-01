import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      smtpNotifications: false,
      smtpServerAddress: '',
      smtpUserName: '',
      smtpPassword: '',
      smtpFromEmail: '',
      smtpToEmail: ''
    };
  }
}
