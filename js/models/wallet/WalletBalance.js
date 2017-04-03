import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('wallet/balance/');
  }
}
