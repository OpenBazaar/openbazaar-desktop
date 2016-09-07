import { Model } from 'backbone';

export default class extends Model {
  // this model will only be { guid: exampleguid }

  get idAttribute() {
    return 'guid';
  }
}

