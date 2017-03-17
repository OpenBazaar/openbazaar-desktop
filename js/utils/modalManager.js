import About from '../views/modals/about/About';
import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';
import ModeratorDetails from '../views/modals/moderatorDetails';

let aboutModal;
let editListingModal;
let debugLogModal;
let moderatorDetailsModal;

export function launchEditListingModal(modalOptions = {}) {
  if (editListingModal) editListingModal.remove();

  editListingModal = new EditListing(modalOptions)
    .render()
    .open();

  return editListingModal;
}

export function launchAboutModal(modalOptions = {}) {
  if (aboutModal) aboutModal.remove();

  aboutModal = new About(modalOptions)
    .render()
    .open();

  return aboutModal;
}

// todo: give opening of the settings modal the same treatment

export function launchDebugLogModal(modalOptions = {}) {
  if (debugLogModal) debugLogModal.remove();

  debugLogModal = new DebugLog(modalOptions)
    .render()
    .open();

  return debugLogModal;
}

export function launchModeratorDetailsModal(modalOptions = {}) {
  if (moderatorDetailsModal) moderatorDetailsModal.remove();

  moderatorDetailsModal = new ModeratorDetails(modalOptions)
      .render()
      .open();

  return moderatorDetailsModal;
}
