import About from '../views/modals/About/About';
import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';

let aboutModal;
let editListindModal;
let debugLogModal;

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
