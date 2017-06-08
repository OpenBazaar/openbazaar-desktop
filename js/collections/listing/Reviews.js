import { Collection } from 'backbone';
import BaseModel from '../../models/BaseModel';


export default class extends Collection {
  constructor(models = [], options = {}) {
    const opts = {
      ...options,
    };
    super(models, opts);
  }

  model(attrs, options) {
    return new BaseModel({
      ...attrs,
    }, options);
  }
}
