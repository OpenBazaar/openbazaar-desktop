import app from '../app';
import { events as listingEvents } from '../models/listing';
import Listing from '../models/listing/Listing';
import Dialog from '../views/modals/Dialog';

const getTitle = (model) => (
  // Model might be a Listing or ListingShort instance.
  model instanceof Listing ?
    model.get('item')
      .get('title') :
    model.get('title')
);

export default function () {
  const statusMessages = {};

  listingEvents.on('destroying', (model, opts) => {
    if (statusMessages[opts.slug]) return;

    const statusMessage = app.statusBar.pushMessage({
      msg: app.polyglot.t('listingDelete.deletingListing',
        { listing: `<em>${getTitle(model)}</em>` }),
      duration: 99999999999,
    });

    statusMessages[opts.slug] = statusMessage;

    opts.xhr.done(() => {
      statusMessage.update(app.polyglot.t('listingDelete.deletedListing',
        { listing: `<em>${getTitle(model)}</em>` }));

      setTimeout(() => (statusMessage.remove()), 3000);
    }).fail((xhr) => {
      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';

      let dialogBody;

      if (!failReason) {
        dialogBody = app.polyglot.t('listingDelete.deletedFailedDialogBody',
          { listing: `<em>${getTitle(model)}</em>` });
      } else if (xhr.status === 404) {
        dialogBody = app.polyglot.t('listingDelete.deletedFailedListingNotFound',
          { listing: `<em>${getTitle(model)}</em>` });
      } else {
        dialogBody = app.polyglot.t('listingDelete.deletedFailedDialogBodyWithReason',
          {
            listing: `<em>${getTitle(model)}</em>`,
            reason: `<br />${failReason}`,
          });
      }

      statusMessage.update({
        msg: app.polyglot.t('listingDelete.deletedFailedStatusMsg',
          { listing: `<em>${getTitle(model)}</em>` }),
        type: 'warning',
      });

      setTimeout(() => (statusMessage.remove()), 3000);

      const failedListingDeleteDialog = new Dialog({
        title: app.polyglot.t('listingDelete.deletedFailedDialogTitle'),
        message: dialogBody,
        buttons: [{
          text: app.polyglot.t('listingDelete.deleteFailedBtnOk'),
          fragment: 'ok',
        }],
      }).on('click-ok', () => failedListingDeleteDialog.close())
      .render()
      .open();
    }).always(() => (delete statusMessages[opts.slug]));
  });
}
