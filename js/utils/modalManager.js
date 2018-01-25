import app from '../app';
import { getOpenModals } from '../views/modals/BaseModal';
import Listing from '../models/listing/Listing';
import About from '../views/modals/about/About';
import EditListing from '../views/modals/editListing/EditListing';
import DebugLog from '../views/modals/DebugLog';
import ModeratorDetails from '../views/modals/moderatorDetails';
import Wallet from '../views/modals/wallet/Wallet';
import Settings from '../views/modals/Settings/Settings';

let aboutModal;
let settingsModal;
let debugLogModal;
let moderatorDetailsModal;
let _wallet;

export function launchEditListingModal(modalOptions = {}) {
  const model = modalOptions.model;
  const openModals = getOpenModals();

  if (!(model instanceof Listing)) {
    throw new Error('In the modalOptions, please provide an instance of ' +
      'a Listing model.');
  }

  if (model.isNew()) {
    const createModal = openModals
      .find(modal => modal instanceof EditListing && modal.model.isNew());
    if (createModal) {
      createModal.bringToTop();
      return createModal;
    }
  }

  const editListingModal = new EditListing(modalOptions)
    .render()
    .open();

  return editListingModal;
}

export function launchAboutModal(modalOptions = {}) {
  if (aboutModal) {
    aboutModal.bringToTop();
    if (modalOptions.initialTab) aboutModal.selectTab(modalOptions.initialTab);
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

  return settingsModal;
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
