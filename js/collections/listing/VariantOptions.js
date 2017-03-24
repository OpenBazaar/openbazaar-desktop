import { guid } from '../../utils';
import { Collection } from 'backbone';
import VariantOption from '../../models/listing/VariantOption';

export default class extends Collection {
  model(attrs, options) {
    return new VariantOption({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
