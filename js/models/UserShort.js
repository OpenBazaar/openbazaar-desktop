import BaseModel from './BaseModel';

export default class extends BaseModel {
  // this model will only be { guid: exampleguid }

  get idAttribute() {
    return 'guid';
  }
}

