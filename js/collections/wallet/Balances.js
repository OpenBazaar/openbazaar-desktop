import app from '../../app';
import { Collection } from 'backbone';
import Balance from '../../models/wallet/Balance';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.guid = options.guid;
  }

  url() {
    return app.getServerUrl('wallet/balance');
  }

  model(attrs, options) {
    return new Balance(attrs, options);
  }

  modelId(attrs) {
    return attrs.code;
  }

  parse(response) {
    return Object.keys(response || {})
      .map(cur => ({
        ...response[cur],
        code: cur,
      }));
  }
}
