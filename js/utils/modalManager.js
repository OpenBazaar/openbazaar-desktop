import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';

let editListindModal;
let debugLogModal;

export function launchEditListingModal(modalOptions = {}) {
  if (editListindModal) editListindModal.remove();

  editListindModal = new EditListing(modalOptions)
    .render()
    .open();

  return editListindModal;
}

// todo: give opening of the settings modal the same treatment

export function launchDebugLogModal(modalOptions = {}) {
  if (debugLogModal) debugLogModal.remove();

  debugLogModal = new DebugLog(modalOptions)
    .render()
    .open();

  return debugLogModal;
}
