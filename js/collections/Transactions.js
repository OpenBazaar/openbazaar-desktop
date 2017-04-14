import app from '../app';
// import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import Transaction from '../models/wallet/Transaction';

export default class extends Collection {
  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  url() {
    return app.getServerUrl('wallet/transactions/');
  }

  modelId(attrs) {
    return attrs.txid;
  }

  parse(response) {
    response.transactions = response.transactions || [];

    // const manyTrans = [];

    // if (response.transactions.length) {
    //   for (let i = 0; i < 20; i++) {
    //     const index = i % response.transactions.length;
    //     // console.log(index);
    //     const tran = JSON.parse(JSON.stringify(response.transactions[index]));
    //     tran.moo = tran.txid;
    //     tran.txid = `${i} ==> ${tran.txid}${Date.now() + Math.random()}`;
    //     // console.log(tran.txid);
    //     manyTrans.push(tran);
    //   }
    // }

    // return manyTrans;
    return response.transactions;
  }
}
