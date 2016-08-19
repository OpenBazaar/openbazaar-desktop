// import $ from 'jquery';
// import app from '../../../app';
import loadTemplate from '../../utils/loadTemplate';
// import SimpleMessage from '../SimpleMessage';
// import Dialog from '../Dialog';
import BaseModal from './BaseModal';
// import General from './General';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP border clrBr',
      // removeOnRoute: false,
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      // General,
    };

    // this.listenTo(app.router, 'will-route', () => {
    //   this.close(true);
    //   this.remove();
    // });
  }

  className() {
    return `${super.className()} editListing`;
  }

  // events() {
  //   return {
  //     'click .js-tab': 'tabClick',
  //     'click .js-save': 'saveClick',
  //     ...super.events(),
  //   };
  // }

  saveClick() {
    console.log('save request yo');
  }

  close() {
  }

  get $saveStatus() {
    return this._$saveStatus || this.$('.saveStatus');
  }

  render() {
    loadTemplate('modals/editListing.html', (t) => {
      this.$el.html(t(this.options));

      super.render();
    });

    return this;
  }
}

