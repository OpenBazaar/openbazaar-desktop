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

  // comparator(balance) {
  //   // put unsupported currencies at the end
  //   // TODO:
  //   // TODO:
  //   // TODO:
  //   // TODO:
  //   // TODO:
  //   // TODO:
  //   // TODO - test that unsupported end up at the end.
  //   return `${balance.get('unsupported') ? 'ZZZZZZZZ' : ''}${balance.get('code')}`;
  // }

  parse(response) {
    return Object.keys(response || {})
      .map(cur => ({
      // todo: is this really neccssary?
      // const clientSupported = app && app.serverConfig && app.serverConfig.wallets &&
      //   app.serverConfig.wallets[cur] && app.serverConfig.wallets[cur].unsupported ||
      //   false;

        ...response[cur],
        code: cur,
        // clientSupported,
      }));
  }
}
