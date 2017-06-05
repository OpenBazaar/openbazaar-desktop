import $ from 'jquery';
import baseVw from '../../../baseVw';
import Payment from './Payment';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    if (!options.collection) {
      throw new Error('Please provide a transactions collection.');
    }

    if (typeof options.orderPrice !== 'number') {
      throw new Error('Please provide the price of the order.');
    }

    if (typeof options.getOrderBalanceRemaining !== 'function') {
      throw new Error('Please provide a function that returns the balance remaining on the order.');
    }

    if (typeof options.isOrderRefundable !== 'function') {
      throw new Error('Please provide a function that returns whether this order can be refunded ' +
        'by the current user.');
    }

    if (typeof options.isOrderConfirmable !== 'function') {
      throw new Error('Please provide a function that returns whether this order can be ' +
        'confirmed by the current user.');
    }

    const isValidParticipantObject = (participant) => {
      let isValid = true;
      if (!participant.id) isValid = false;
      if (typeof participant.getProfile !== 'function') isValid = false;
      return isValid;
    };

    const getInvalidParticpantError = (type = '') =>
      (`The ${type} object is not valid. It should have an id ` +
        'as well as a getProfile function that returns a promise that ' +
        'resolves with a profile model.');

    if (!opts.vendor) {
      throw new Error('Please provide a vendor object.');
    }

    if (!isValidParticipantObject(options.vendor)) {
      throw new Error(getInvalidParticpantError('vendor'));
    }

    if (!opts.buyer) {
      throw new Error('Please provide a buyer object.');
    }

    if (!isValidParticipantObject(options.buyer)) {
      throw new Error(getInvalidParticpantError('buyer'));
    }

    super(opts);
    this.options = opts;
    this.payments = [];

    this.listenTo(this.collection, 'update', this.render);
  }

  className() {
    return 'payments';
  }

  createPayment(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const payment = this.createChild(Payment, {
      ...options,
      model,
      initialState: {
        ...options.initialState,
      },
    });

    this.payments.push(payment);

    return payment;
  }

  render() {
    const paymentsContainer = document.createDocumentFragment();
    const balanceRemaining = this.options.getOrderBalanceRemaining();

    this.payments.forEach(payment => (payment.remove()));
    this.payments = [];

    this.collection.models.forEach((payment, index) => {
      const paidSoFar = this.collection.models
        .slice(0, index + 1)
        .reduce((total, model) => total + model.get('value'), 0);
      const isMostRecentPayment = index === this.collection.length - 1;
      const paymentView = this.createPayment(payment, {
        initialState: {
          paymentNumber: index + 1,
          balanceRemaining,
          amountShort: this.options.orderPrice - paidSoFar,
          showRefundButton: isMostRecentPayment && this.options.isOrderRefundable(),
          showAcceptButton: isMostRecentPayment && this.options.isOrderConfirmable(),
        },
      });
      $(paymentsContainer).prepend(paymentView.render().el);
    });

    if (this.payments.length) {
      this.options.vendor.getProfile()
        .done(profile => {
          this.payments.forEach(payment => payment.setState({ payee: profile.get('name') || '' }));
        });

      // Any refunds will need the buyer name.
      // this.collection.models
      //   .filter(payment => payment.get('value') < 0).length)
        

      // }
    }

    this.$el.empty()
      .append(paymentsContainer);

    return this;
  }
}
