import BaseModel from '../BaseModel';
import app from '../../app';

export default class extends BaseModel {
  url() {
    return app.getServerUrl(`ob/case/${this.id}`);
  }

  get idAttribute() {
    return 'caseId';
  }
}
