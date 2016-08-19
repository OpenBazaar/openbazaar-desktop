import EditListing from '../views/modals/EditListing';

let editListindModal;

export function launchEditListingModal(modalOptions = {}) {
  if (!editListindModal || !editListindModal.isOpen()) {
    editListindModal = new EditListing(modalOptions).render().open();
  }

  return editListindModal;
}

// todo: give opening of the settings modal the same treatment