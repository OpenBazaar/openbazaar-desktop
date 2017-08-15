import BaseModel from './BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'peerId';
  }
}

