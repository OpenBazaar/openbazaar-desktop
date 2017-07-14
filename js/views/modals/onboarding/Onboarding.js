import app from '../../../app';
import { getCurrentConnection } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      initialState: {
        screen: 'intro',
        screen: 'info',
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.screens = ['intro', 'info', 'tos'];
  }

  className() {
    return `${super.className()} onboarding modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-changeServer': 'onClickChangeServer',
      'click .js-getStarted': 'onClickGetStarted',
      'click .js-navBack': 'onClickNavBack',
      'click .js-navNext': 'onClickNavNext',
      ...super.events(),
    };
  }

  onClickChangeServer() {
    app.connectionManagmentModal.open();
  }

  onClickGetStarted() {
    this.setState({ screen: 'info' });
  }

  onClickNavBack() {
    const curScreen = this.getState().screen;

    this.setState({
      screen: this.screens[this.screens.indexOf(curScreen) - 1],
    });
  }

  onClickNavNext() {
    const curScreen = this.getState().screen;

    this.setState({
      screen: this.screens[this.screens.indexOf(curScreen) + 1],
    });
  }

  render() {
    loadTemplate('modals/onboarding/onboarding.html', t => {
      loadTemplate('brandingBox.html', brandingBoxT => {
        this.$el.html(t({
          brandingBoxT,
          ...this.getState(),
          curConn: getCurrentConnection(),
          errors: {},
          max: {},
          countryList: [],
          currencyList: [],
        }));
      });
    });
    super.render();

    return this;
  }
}
