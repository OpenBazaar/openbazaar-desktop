// import $ from 'jquery';
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

  // className() {
  //   return `${super.className()} onboarding modalScrollPage modalMedium`;
  // }

  events() {
    return {
      // 'click .js-changeServer': 'onClickChangeServer',
      ...super.events(),
    };
  }

  render() {
    loadTemplate('modals/onboarding/walletSetup.html', t => {
      this.$el.html(t({}));
      super.render();
    });

    return this;
  }
}
