import { Collection } from 'backbone';
import BaseModel from '../models/BaseModel';


export default class extends Collection {
  model(attrs, options) {
    return new BaseModel(attrs, options);
  }
}
