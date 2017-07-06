import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import SocialAccount from './SocialAccount';
import SocialAccountMd from '../../../models/profile/SocialAccount';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a collection.');
    }

    super({
      className: 'socialAccounts gutterV',
      ...options,
    });
    this.options = options;
    this.accountViews = [];

    this.listenTo(this.collection, 'add', (md) => {
      const view = this.createAccountView(md);

      this.$socialWrapper.append(view.render().el);

      this.accountViews.push(view);

      if (this.collection.length >= this.options.maxCouponCount) {
        this.$addAccount.addClass('hide');
      }
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.accountViews.splice(removeOpts.index, 1)[0]).remove();

      if (this.collection.length < this.options.maxCouponCount) {
        this.$addAccount.removeClass('hide');
      }
    });

    // if the collection is empty, add a blank account to the form
    if (this.collection.length === 0) this.collection.add({ type: '', username: '' });
  }

  events() {
    return {
      'click .js-addAccount': 'onClickAddAccount',
    };
  }

  onClickAddAccount() {
    this.collection.add(new SocialAccountMd());
    this.accountViews[this.accountViews.length - 1]
      .$('input[name=type]')
      .focus();
  }

  setCollectionData() {
    this.accountViews.forEach(account => account.setModelData());
  }

  createAccountView(model, options = {}) {
    const accountErrors = {};

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
