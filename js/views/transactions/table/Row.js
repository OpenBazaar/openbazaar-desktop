/*
  This table is re-used for Sales, Purchases and Cases.
*/

import app from '../../../app';
import _ from 'underscore';
import moment from 'moment';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const types = ['sales', 'purchases', 'cases'];
    const opts = {
      initialState: {
        acceptOrderInProgress: false,
      },
      type: 'sales',
      ...options,
    };

    if (types.indexOf(opts.type) === -1) {
      throw new Error('Please provide a valid type.');
    }

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model');
    }

    this.type = opts.type;
    this._state = {
      ...opts.initialState || {},
    };

    this.$el.toggleClass('unread', !this.model.get('read'));
    this.listenTo(this.model, 'change:read', (md, read) => {
      this.$el.toggleClass('unread', !read);
    });
    this.listenTo(this.model, 'change', md => {
      if (md.hasChanged('read') &&
        Object.keys(md.changedAttributes).length === 1) {
        // if the only thing that has changed is the read flag,
        // we'll do nothing since that has it's own handler
        return;
      }

      this.render();
    });
  }

  tagName() {
    return 'tr';
  }

  events() {
    return {
      'click .js-acceptOrder': 'onClickAcceptOrder',
      'click .js-cancelOrder': 'onClickCancelOrder',
      'click .js-userCol': 'onClickUserColLink',
      click: 'onRowClick',
    };
  }

  onClickAcceptOrder(e) {
    this.trigger('clickAcceptOrder', { view: this });
    e.stopPropagation();
  }

  onClickCancelOrder(e) {
    this.trigger('clickCancelOrder', { view: this });
    e.stopPropagation();
  }

  onClickUserColLink(e) {
    e.stopPropagation();
  }

  onRowClick() {
    this.trigger('clickRow', { view: this });
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('transactions/table/row.html', (t) => {
      this.$el.html(t({
        type: this.type,
        ...this._state,
        ...this.model.toJSON(),
        userCurrency: app.settings.get('localCurrency'),
        moment,
      }));
    });

    return this;
  }
}
