import EditListing from '../views/modals/EditListing';

let editListindModal;

export function launchEditListingModal(modalOptions = {}) {
  if (editListindModal) editListindModal.remove();

  editListindModal = new EditListing(modalOptions)
    .render()
    .open();

  return editListindModal;
}

// todo: give opening of the settings modal the same treatment

// todo: close any open modals when opening a new one
