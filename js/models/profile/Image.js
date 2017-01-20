import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      tiny: '',
      small: '',
      medium: '',
      large: '',
      original: '',
    };
  }
}
