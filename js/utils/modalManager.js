import About from '../views/modals/about/About';
import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';
import ModeratorDetails from '../views/modals/moderatorDetails';
import Wallet from '../views/modals/wallet/Wallet';

let aboutModal;
let editListingModal;
let debugLogModal;
let moderatorDetailsModal;
let _wallet;

export function launchEditListingModal(modalOptions = {}) {
  if (editListingModal) editListingModal.remove();

  editListingModal = new EditListing(modalOptions)
    .render()
    .open();

  return editListingModal;
}

export function launchAboutModal(modalOptions = {}) {
  if (aboutModal) {
    aboutModal.bringToTop();
  } else {
    aboutModal = new About({
      removeOnClose: true,
      ...modalOptions,
    })
      .render()
      .open();

    aboutModal.on('modal-will-remove', () => (aboutModal = null));
  }

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

export function launchWallet(modalOptions = {}) {
  if (_wallet) {
    _wallet.open();
  } else {
    _wallet = new Wallet(modalOptions)
      .render()
      .open();
  }

  return _wallet;
}

export function getWallet() {
  return _wallet;
}
