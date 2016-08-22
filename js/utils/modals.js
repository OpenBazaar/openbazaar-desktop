import EditListing from '../views/modals/EditListing';

let editListindModal;

export function launchEditListingModal(modalOptions = {}) {
  const modalOpts = {
    mode: 'create',
    ...modalOptions,
  };

  if (!editListindModal || (editListindModal && !editListindModal.isOpen()) ||
    // if there's an open one in create mode and we are attempting to open one in create mode
    // then we'll do nothing.
    (editListindModal && !(modalOpts.mode === 'create' && editListindModal.mode === 'create'))) {
    editListindModal = new EditListing(modalOptions).render().open();
  }

  return editListindModal;
}

// todo: give opening of the settings modal the same treatment
