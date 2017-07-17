import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import SocialAccount from './SocialAccount';
import SocialAccountMd from '../../../models/profile/SocialAccount';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!options.maxAccounts) {
      throw new Error('Please provide a maximum number of accounts.');
    }

    super({
      className: 'socialAccounts gutterV',
      ...options,
    });
    this.options = options;
    this.accountViews = [];
    this.maxAccounts = options.maxAccounts;

    this.listenTo(this.collection, 'add', (md) => {
      const view = this.createAccountView(md);
      this.getCachedEl('.js-socialWrapper').append(view.render().el);
      this.accountViews.push(view);
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.accountViews.splice(removeOpts.index, 1)[0]).remove();
      this.showLimitErr(this.accountViews.length >= this.maxAccounts);
    });

    // if the collection is empty on construction, add a blank account to the form
    if (this.collection.length === 0) {
      this.addBlankAccount();
    }
  }

  events() {
    return {
      'click .js-addAccount': 'onClickAddAccount',
    };
  }

  addBlankAccount() {
    this.collection.add(new SocialAccountMd());
    const index = this.accountViews.length ? this.accountViews.length - 1 : 0;
    this.accountViews[index]
      .$('input[name=type]')
      .focus();
  }

  showLimitErr(show) {
    if (show !== this._showLimitErr) {
      this._showLimitErr = show;
      this.getCachedEl('.js-limitErr').toggleClass('hide', !show);
    }
  }

  onClickAddAccount() {
    // don't add a blank acount if the maximum has been reached
    if (this.accountViews.length >= this.maxAccounts) {
      this.showLimitErr(true);
    } else {
      this.addBlankAccount();
    }
  }

  setCollectionData() {
    this.accountViews.forEach(account => account.setModelData());
  }

  createAccountView(model, options = {}) {
    const view = this.createChild(SocialAccount, {
      model,
      ...options,
    });

    this.listenTo(view, 'remove-click', () => {
      this.collection.remove(view.model);
      // if the last account is removed, replace it with a blank one
      if (this.collection.length === 0) {
        this.addBlankAccount();
      }
    });

    return view;
  }

  render() {
    super.render();
    loadTemplate('modals/settings/socialAccounts.html', t => {
      this.$el.html(t({
        max: this.maxAccounts,
      }));

      this.accountViews.forEach(account => account.remove());
      this.accountViews = [];
      const accountFrag = document.createDocumentFragment();

      this.collection.forEach(account => {
        const view = this.createAccountView(account);
        this.accountViews.push(view);
        view.render().$el.appendTo(accountFrag);
      });

      this.getCachedEl('.js-socialWrapper').append(accountFrag);
    });

    return this;
  }
}
