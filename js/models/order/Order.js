import BaseModel from '../BaseModel';
import app from '../../app';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderId';
  }

  url() {
    return app.getServerUrl(`ob/order/${this.id}`);
  }
}
