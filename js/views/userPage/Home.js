import $ from 'jquery';
import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import { clipboard } from 'electron';
import BaseVw from '../baseVw';
import app from '../../app';
import UserCard from '../userCard';
import { launchModeratorDetailsModal } from '../../utils/modalManager';
import { openSimpleMessage } from '../modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.ownPage = options.ownPage;

    this.userCard = new UserCard({ model: this.model, hideControls: true });

    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => {
      app.settings.set(this.settings.toJSON());
      this.$addModeratorLbl.toggleClass('hide', this.ownMod);
      this.$removeModeratorLbl.toggleClass('hide', !this.ownMod);
    });
  }

  className() {
    return 'userPageHome';
  }

  events() {
    return {
      'click .js-termsLink': 'termsClick',
      'click .js-addModerator': 'changeModeratorClick',
      'click .js-guid': 'guidClick',
      'mouseleave .js-guid': 'guidLeave',
    };
  }

  get ownMod() {
    return app.settings.get('storeModerators').indexOf(this.model.id) !== -1;
  }

  termsClick() {
    // show the moderator details modal
    const modModal = launchModeratorDetailsModal({ model: this.model });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.$modBtn.addClass('processing');
      this.saveModeratorList(true);
    });
  }

  changeModeratorClick() {
    if (this.ownMod) {
      this.$modBtn.addClass('processing');
      this.saveModeratorList(false);
    } else {
      // show the moderator details modal
      const modModal = launchModeratorDetailsModal({ model: this.model });
      this.listenTo(modModal, 'addAsModerator', () => {
        this.$modBtn.addClass('processing');
        this.saveModeratorList(true);
      });
    }
  }

  saveModeratorList(add = false) {
    let modList = app.settings.get('storeModerators');

    if (add && !this.ownMod) {
      modList.push(this.model.id);
    } else {
      modList = _.without(modList, this.model.id);
    }

    const formData = { storeModerators: modList };
    this.settings.set(formData);

    if (!this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('userPage.status.saving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      this.settings.save(formData, {
        attrs: formData,
        type: 'PATCH',
      })
          .done(() => {
            statusMessage.update({
              msg: app.polyglot.t('userPage.status.done'),
              type: 'confirmed',
            });
          })
          .fail((...args) => {
            const errMsg = args[0] && args[0].responseJSON &&
                args[0].responseJSON.reason || '';
            openSimpleMessage(app.polyglot.t('userPage.status.error'), { errMsg });

            statusMessage.update({
              msg: app.polyglot.t('userPage.status.fail'),
              type: 'warning',
            });
          })
          .always(() => {
            this.$modBtn.removeClass('processing');
            setTimeout(() => statusMessage.remove(), 3000);
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

      this.$modBtn = this.$('.js-addModerator');
      this.$addModeratorLbl = this.$('.js-addModeratorLbl');
      this.$removeModeratorLbl = this.$('.js-removeModeratorLbl');
    });

    return this;
  }
}

