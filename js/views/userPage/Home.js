import $ from 'jquery';
import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import { clipboard } from 'electron';
import BaseVw from '../baseVw';
import app from '../../app';
import UserCard from '../UserCard';
import { launchModeratorDetailsModal } from '../../utils/modalManager';
import { openSimpleMessage } from '../modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.ownPage = options.ownPage;
    this.userCard = this.createChild(UserCard, { model: this.model });
    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => {
      app.settings.set(this.settings.toJSON());
    });

    this.listenTo(app.settings, 'change:storeModerators', () => {
      this.$addModerator.toggleClass('hide', this.ownMod);
      this.$removeModerator.toggleClass('hide', !this.ownMod);
    });
  }

  className() {
    return 'userPageHome';
  }

  events() {
    return {
      'click .js-termsLink': 'termsClick',
      'click .js-addModerator': 'addModeratorClick',
      'click .js-removeModerator': 'removeModeratorClick',
      'click .js-guid': 'guidClick',
      'mouseleave .js-guid': 'guidLeave',
    };
  }

  get ownMod() {
    return app.settings.ownMod(this.model.id);
  }

  termsClick() {
    // show the moderator details modal
    const modModal = launchModeratorDetailsModal({ model: this.model });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.$addModerator.addClass('processing');
      this.saveModeratorList(true);
    });
  }

  addModeratorClick() {
    // show the moderator details modal
    const modModal = launchModeratorDetailsModal({ model: this.model });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.$addModerator.addClass('processing');
      this.saveModeratorList(true);
    });
  }

  removeModeratorClick() {
    this.$removeModerator.addClass('processing');
    this.saveModeratorList(false);
  }

  saveModeratorList(add = false) {
    // clone the array, otherwise it is a reference
    let modList = _.clone(app.settings.get('storeModerators'));

    if (add && !this.ownMod) {
      modList.push(this.model.id);
    } else {
      modList = _.without(modList, this.model.id);
    }

    const formData = { storeModerators: modList };
    this.settings.set(formData);

    if (!this.settings.validationError) {
      this.settings.save(formData, {
        attrs: formData,
        type: 'PATCH',
      })
          .fail((...args) => {
            const errMsg = args[0] && args[0].responseJSON &&
                args[0].responseJSON.reason || '';
            const phrase = add ? 'userPage.modAddError' : 'userPage.modRemoveError';
            openSimpleMessage(app.polyglot.t(phrase), { errMsg });
          })
          .always(() => {
            this.$modBtn.removeClass('processing');
          });
    }
  }

  guidClick(e) {
    const guid = $(e.target).data('guid');
    clipboard.writeText(guid);
    this.$('.js-guidCopied').fadeIn(600);
  }

  guidLeave() {
    this.$('.js-guidCopied').fadeOut(600);
  }

  render() {
    loadTemplate('userPage/home.html', (t) => {
      this.$el.html(t({
        currentModerator: this.ownMod,
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));

      this.$('.js-userCard').append(this.userCard.render().$el);

      this.$modBtn = this.$('.js-addModerator, .js-removeModerator');
      this.$addModerator = this.$('.js-addModerator');
      this.$removeModerator = this.$('.js-removeModerator');
    });

    return this;
  }
}

