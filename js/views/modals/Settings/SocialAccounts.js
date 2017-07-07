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

      this.$socialWrapper.append(view.render().el);

      this.accountViews.push(view);
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.accountViews.splice(removeOpts.index, 1)[0]).remove();

      if (this.collection.length < this.maxAccounts) {
        this.hideAddBtn(false);
      }

      // if the last account is removed, replace it with a blank one
      if (this.collection.length === 0) {
        this.addFirstAccount();
      }
    });

    // if the collection is empty on construction, add a blank account to the form
    if (this.collection.length === 0) {
      this.addFirstAccount();
    }
  }

  addFirstAccount() {
    this.collection.add(new SocialAccountMd());
    this.hideAddBtn(false);
    this.accountViews[0]
      .$('input[name=type]')
      .focus();
  }

  events() {
    return {
      'click .js-addAccount': 'onClickAddAccount',
    };
  }

  hideAddBtn(bool) {
    this.$addAccount.toggleClass('hide', bool);
  }

  onClickAddAccount() {
    const data = this.accountViews[this.accountViews.length - 1].getFormData();
    // don't add another blank account unless the previous is complete
    if (data.type && data.username) {
      this.collection.add(new SocialAccountMd());
    }
    this.accountViews[this.accountViews.length - 1]
      .$('input[name=type]')
      .focus();
  }

  setCollectionData() {
    this.accountViews.forEach(account => account.setModelData());
  }

  createAccountView(model, options = {}) {
    const accountErrors = {};

    // TODO: show length errors
    if (this.options.accountErrors) {
      Object.keys(this.options.accountErrors)
        .forEach(errKey => {
          if (errKey.startsWith(`socialAccounts[${model.cid}]`)) {
            accountErrors[errKey.slice(errKey.indexOf('.') + 1)] =
              this.options.accountErrors[errKey];
          }
        });
    }

    const view = this.createChild(SocialAccount, {
      model,
      accountErrors,
      ...options,
    });

    this.listenTo(view, 'remove-click', () => {
      this.collection.remove(view.model);
    });

    if (this.collection.length >= this.maxAccounts) {
      this.hideAddBtn(true);
    }

    return view;
  }

  get $socialWrapper() {
    return this._$socialWrapper ||
      (this._$socialWrapper =
        this.$('.js-socialWrapper'));
  }

  get $addAccount() {
    return this._$addAccount ||
      (this._$addAccount =
        this.$('.js-addAccount'));
  }

  render() {
    loadTemplate('modals/settings/socialAccounts.html', t => {
      this.$el.html(t({
        accounts: this.collection.toJSON(),
        maxCouponCount: this.options.maxCouponCount,
      }));

      this._$socialWrapper = null;
      this._$addAccount = null;

      this.accountViews.forEach(account => account.remove());
      this.accountViews = [];
      const accountFrag = document.createDocumentFragment();

      this.collection.forEach(account => {
        const view = this.createAccountView(account);
        this.accountViews.push(view);
        view.render().$el.appendTo(accountFrag);
      });

      this.$socialWrapper.append(accountFrag);
    });

    return this;
  }
}
