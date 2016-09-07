import { Collection } from 'backbone';
import PhotoUpload from '../models/PhotoUpload';

export default class extends Collection {
  model(attrs, options) {
    return new PhotoUpload(attrs, options);
  }
}
