import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      peerID: '',
      type: '',
    };
  }

  get idAttribute() {
    return 'peerID';
  }
}
