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

    super(options);
    this.options = options;
    this.accountViews = [];
    this.maxAccounts = options.maxAccounts;

    this.listenTo(this.collection, 'add', (md) => {
      const view = this.createAccountView(md);
      this.accountViews.push(view);
      this.getCachedEl('.js-socialWrapper').append(view.render().el);
      this.showLimit();
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      this.accountViews.splice(removeOpts.index, 1)[0].remove();
      this.showLimit();
    });
  }

  className() {
    return 'socialAccounts gutterV';
  }

  events() {
    return {
      'click .js-addAccount': 'onClickAddAccount',
    };
  }

  get lastIndex() {
    return this.collection.length ? this.collection.length - 1 : 0;
  }

  addBlankAccount() {
    const notEmpty = !!this.collection.length;
    let name = 'type';
    const blank = notEmpty ? this.accountViews[this.lastIndex].firstBlankField : '';
    // if the current last account isn't completely filled in, don't add a new one
    if (!blank) {
      this.collection.add(new SocialAccountMd());
    } else {
      name = blank;
    }
    this.accountViews[this.lastIndex]
      .$(`input[name=${name}]`)
      .focus();
  }

  showLimit(show = this.accountViews.length >= this.maxAccounts) {
    if (show !== this._showLimit) {
      this._showLimit = show;
      this.getCachedEl('.js-addAccount').toggleClass('hide', show);
    }
  }

  onClickAddAccount() {
    this.addBlankAccount();
  }

  setCollectionData() {
    this.accountViews.forEach(account => {
      account.setModelData();
      // remove blank accounts
      if (!account.model.get('type') && !account.model.get('username')) {
        this.collection.remove(account.model);
      }
    });
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
        currentCount: this.collection.length,
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

      // if the collection is empty on render, add a blank account to the form
      if (this.collection.length === 0) {
        this.collection.add(new SocialAccountMd());
      }
    });

    return this;
  }
}
