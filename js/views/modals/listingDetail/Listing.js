import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import { events as listingEvents } from '../../../models/listing/';
import BaseModal from '../BaseModal';
import PopInMessage from '../../PopInMessage';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: false,
      ...options,
    };

    super(opts);
    this.options = opts;
    this._shipsFreeToMe = this.model.shipsFreeToMe;

    this.listenTo(app.settings, 'change:country', () =>
      (this.shipsFreeToMe = this.model.shipsFreeToMe));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, updateOpts) => {
        if (updateOpts.changes.added.length ||
          updateOpts.changes.removed.length) {
          this.shipsFreeToMe = this.model.shipsFreeToMe;
        }
      });

    if (this.model.isOwnListing()) {
      this.listenTo(listingEvents, 'saved', (md, savedOpts) => {
        const slug = this.model.get('listing')
          .get('slug');

        if (savedOpts.slug === slug && savedOpts.hasChanged()) {
          this.showDataChangedMessage();
        }
      });
    }
  }

  className() {
    return `${super.className()} listingDetail modalTop`;
  }

  events() {
    return {
      'click .js-editListing': 'onClickEditListing',
      'click .js-deleteListing': 'onClickDeleteListing',
      ...super.events(),
    };
  }

  onClickEditListing() {
    this.editModal = launchEditListingModal({
      model: this.model,
      returnText: app.polyglot.t('listingDetail.editListingReturnText'),
    });

    this.$el.addClass('hide');

    const onCloseEditModal = () => {
      this.close();

      if (!this.isRemoved()) {
        this.$el.removeClass('hide');
      }
    };

    this.listenTo(this.editModal, 'close', onCloseEditModal);

    const onEditModalClickReturn = () => {
      this.stopListening(null, null, onCloseEditModal);
      this.editModal.remove();
      this.$el.removeClass('hide');
    };

    this.listenTo(this.editModal, 'click-return', onEditModalClickReturn);
  }

  onClickDeleteListing() {
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;

    this.destroyRequest = this.model.destroy({ wait: true });

    if (this.destroyRequest) {
      this.$deleteListing.addClass('processing');

      this.destroyRequest.done(() => {
        if (this.destroyRequest.statusText === 'abort' ||
          this.isRemoved()) return;

        this.close();
      }).always(() => {
        if (!this.isRemoved()) {
          this.$deleteListing.removeClass('processing');
        }
      });
    }
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn || (this.dataChangePopIn && this.dataChangePopIn.isRemoved())) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText: 'Listing data has changed (translate me). ' +
          '<a class="js-refresh">refresh</a>',
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.render()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  get shipsFreeToMe() {
    return this._shipsFreeToMe;
  }

  set shipsFreeToMe(shipsFree) {
    const prevVal = this._shipsFreeToMe;
    this._shipsFreeToMe = !!shipsFree;

    if (prevVal !== this._shipsFreeToMe) {
      this.$shipsFreeBanner[this._shipsFreeToMe ? 'removeClass' : 'addClass']('hide');
    }
  }

  get $deleteListing() {
    return this._$deleteListing || this.$('.js-deleteListing');
  }

  get $shipsFreeBanner() {
    return this._$shipsFreeBanner || this.$('.js-shipsFreeBanner');
  }

  get $popInMessages() {
    return this._$popInMessages ||
      (this._$popInMessages = this.$('.js-popInMessages'));
  }

  remove() {
    if (this.editModal) this.editModal.remove();
    if (this.destroyRequest) this.destroyRequest.abort();
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();

    loadTemplate('modals/listingDetail/listing.html', t => {
      this.$el.html(t({
        ...this.model.get('listing').toJSON(),
        shipsFreeToMe: this.shipsFreeToMe,
        ownListing: this.model.isOwnListing(),
      }));

      super.render();

      this._$deleteListing = null;
      this._$shipsFreeBanner = null;
      this._$popInMessages = null;
    });

    return this;
  }
}
