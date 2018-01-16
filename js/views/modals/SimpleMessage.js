import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

/*
  Please Note: This Modal is designed for a very simple message (containing a title and a
  message body). If you need something beyond that, check out the Dialog which will allow
  you to optionally pass in classes as well as buttons. If you need something beyond that,
  please create a custom modal extending from the baseModal.
*/

class SimpleMessage extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      removeOnRoute: true,
      title: '',
      message: '',
      ...options,
    };

    super(opts);

    this.options = opts;
    this.title = options.title;
    this.message = options.message;
    this.messageHtml = options.messageHtml;
  }

  className() {
    return `${super.className()} messageModal simpleMessage`;
  }

  open(title = this.options.title, message = this.options.message) {
    if (!title && !message) {
      throw new Error('Please provide a title and / or message.');
    }

    if (title !== this.title || message !== this.message) {
      this.title = title;
      this.message = message;
      this.render();
    }

    super.open();
  }

  render() {
    loadTemplate('modals/simpleMessage.html', (t) => {
      this.$el.html(t({
        title: this.title,
        message: this.message,
        messageHtml: this.messageHtml,
      }));

      super.render();
    });

    return this;
  }
}

export default SimpleMessage;

// Convenience method to create a SimpleMessage modal,
// render and open it.
export function openSimpleMessage(title = '', message = '', options = {}) {
  if (!title && !message) {
    throw new Error('Please provide a title and / or message.');
  }

  const dialog = new SimpleMessage({
    title,
    message,
    ...options,
  });

  dialog.render().open();

  return dialog;
}
