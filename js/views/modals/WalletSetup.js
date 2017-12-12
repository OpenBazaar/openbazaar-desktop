// import $ from 'jquery';
import { remote } from 'electron';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      // initialState: {
      //   screen: 'intro',
      //   saveInProgress: false,
      //   ...options.initialState,
      // },
      ...options,
    };

    super(opts);
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-browseZcashBinary': 'onClickBrowseZcashBinary',
      'change .js-binaryFileUpload': 'onChangeBinaryFileUpload',
      ...super.events(),
    };
  }

  onClickBrowseZcashBinary() {
    // this.getCachedEl('.js-binaryFileUpload').trigger('click');
    remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, (sizzle) => {
      console.log('sizzle');
      window.sizzle = sizzle;
    });
  }

  // onChangeBinaryFileUpload(e) {
  // }

  render() {
    super.render();
    loadTemplate('modals/walletSetup.html', t => {
      this.$el.html(t({}));
      super.render();
    });

    return this;
  }
}
