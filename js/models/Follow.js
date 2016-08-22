import { Model } from 'backbone';

export default class extends Model {
  defaults() {
    return {
      guid: '',
    };
  }

  get idAttribute() {
    return 'guid';
  }
}

