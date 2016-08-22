// import $ from 'jquery';
// import app from '../../../app';
import mixin from 'mixin';
import loadTemplate from '../../utils/loadTemplate';
// import SimpleMessage from '../SimpleMessage';
// import Dialog from '../Dialog';
import ScrollLinks from '../ScrollLinks';
import BaseModal from './BaseModal';
// import General from './General';

export default class extends mixin(ScrollLinks, BaseModal) {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP border clrBr',
      // removeOnRoute: false,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.mode = options.mode || 'create';

    // this.listenTo(app.router, 'will-route', () => {
    //   this.close(true);
    //   this.remove();
    // });
  }

  className() {
    return `${super.className()} editListing tabbedModal`;
  }

  // events() {
  //   return {
  //     'click .js-tab': 'tabClick',
  //     'click .js-save': 'saveClick',
  //     ...super.events(),
  //   };
  // }

  get mode() {
    return this._mode;
  }

  set mode(mode) {
    if (['create', 'edit'].indexOf(mode) === -1) {
      throw new Error('Please specify either a \'create\' or \'edit\' mode.');
    }
  }

  saveClick() {
    console.log('save request yo');
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

