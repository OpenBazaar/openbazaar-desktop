import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      type: 'facebook',
      username: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }
}
