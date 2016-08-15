import StatusMessage from './StatusMessage';

export default class extends StatusMessage {
  events() {
    return {
      'click .js-retry': 'retry',
      ...(super.events && super.events() || {}),
    };
  }

  retry() {
    this.trigger('click-retry');
  }
}
