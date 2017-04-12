import app from '../app';
import About from '../views/modals/about/About';
import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';
import ModeratorDetails from '../views/modals/moderatorDetails';
import Wallet from '../views/modals/wallet/Wallet';
import Settings from '../views/modals/Settings/Settings';
import Purchase from '../views/modals/purchase/Purchase';

let aboutModal;
let settingsModal;
let editListingModal;
let debugLogModal;
let moderatorDetailsModal;
let _wallet;
let purchaseModal;

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

export function launchSettingsModal(modalOptions = {}) {
  if (settingsModal) {
    settingsModal.bringToTop();
  } else {
    settingsModal = new Settings({
      removeOnClose: true,
      ...modalOptions,
    })
      .render()
      .open();

    settingsModal.on('modal-will-remove', () => (settingsModal = null));
  }

  return aboutModal;
}

export function launchPurchaseModal(modalOptions = {}) {
  if (purchaseModal) {
    purchaseModal.bringToTop();
  } else {
    purchaseModal = new Purchase({
      removeOnClose: true,
      ...modalOptions,
    })
        .render()
        .open();

    purchaseModal.on('modal-will-remove', () => (purchaseModal = null));
  }

  return aboutModal;
}

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
    _wallet = new Wallet({
      removeOnRoute: false,
      ...modalOptions,
    })
      .render()
      .open();

    app.router.on('will-route', () => _wallet.close());
  }

  return _wallet;
}

export function getWallet() {
  return _wallet;
}
