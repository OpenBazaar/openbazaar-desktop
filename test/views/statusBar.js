import $ from 'jquery';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { View } from 'backbone';
import StatusBar from '../../js/views/StatusBar';
import StatusMessageVw from '../../js/views/StatusMessage';
import StatusMessage from '../../js/models/StatusMessage';

describe('the status bar', () => {
  describe('has a pushMessage method', () => {
    it('which throws an error if you do not pass it a message as a string or object', () => {
      const statusBar = new StatusBar();
      let errorThrown = false;

      try {
        statusBar.pushMessage();
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage(true);
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage(93);
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage(null);
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage(undefined);
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
    });

    it('which throws an error if you pass in a type, but not one of the available ones', () => {
      const statusBar = new StatusBar();
      let errorThrown = false;

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          type: 'dreadful',
        });
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          type: 'saucy',
        });
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          type: 'loopy',
        });
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
    });

    const msgTypes = new StatusMessage().getMessageTypes();

    if (msgTypes.length) {
      it('does not throw an error if you pass in a type that is one of the available ones', () => {
        const statusBar = new StatusBar();
        let errorThrown = false;

        try {
          msgTypes.forEach((type) => {
            statusBar.pushMessage({
              msg: 'The status is moo',
              type,
            });
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(false);
      });
    }

    it('which throws an error if you pass in a duration, but not as a number', () => {
      const statusBar = new StatusBar();
      let errorThrown = false;

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          duration: 'dreadful',
        });
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          duration: true,
        });
      } catch (e) {
        errorThrown = true;
      }

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          duration: '5678',
        });
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
    });

    it('does not throw an error if you pass in a duration as a number', () => {
      const statusBar = new StatusBar();
      let errorThrown = false;

      try {
        statusBar.pushMessage({
          msg: 'The status is moo',
          duration: 5678,
        });
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(false);
    });

    it('throws an error if you pass in a View that is not a descendant of the StatusMessage view',
      () => {
        const statusBar = new StatusBar();
        let errorThrown = false;

        try {
          statusBar.pushMessage({
            msg: 'The status is moo',
            View,
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);
      });

    it('doesn\'t throw an error if you pass in a View that is a descendant of the StatusMessage' +
      ' view',
      () => {
        const statusBar = new StatusBar();
        let errorThrown = false;

        class MyStatusMsg extends StatusMessageVw {}

        try {
          statusBar.pushMessage({
            msg: 'The status is moo',
            View: MyStatusMsg,
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(false);
      });

    it('which results in a new status message being added to the DOM', () => {
      const statusBar = new StatusBar();
      $('#statusBar').html(statusBar.render().el);

      statusBar.pushMessage('check the facts, son');
      statusBar.pushMessage({
        msg: 'green eggs and ham, i am',
      });

      expect($('#statusBar .statusMessage').length).to.equal(2);
    });

    it('which results in a new status message being added to the DOM with the given text', () => {
      const statusBar = new StatusBar();
      $('#statusBar').html(statusBar.render().el);

      statusBar.pushMessage('check the facts, son');
      statusBar.pushMessage({
        msg: 'green eggs and ham, i am',
      });

      expect(
        $('#statusBar .statusMessage').eq(1)
          .text()
          .trim()
        ).to.equal('check the facts, son');

      expect(
        $('#statusBar .statusMessage').eq(0)
          .text()
          .trim()
        ).to.equal('green eggs and ham, i am');
    });

    it('which returns an object with a method to update the text of the status message', () => {
      const statusBar = new StatusBar();
      $('#statusBar').html(statusBar.render().el);

      const statusMessage = statusBar.pushMessage('check the facts, son');

      expect(
        $('#statusBar .statusMessage').eq(0)
          .text()
          .trim()
        ).to.equal('check the facts, son');

      statusMessage.update('feel good yo');

      expect(
        $('#statusBar .statusMessage').eq(0)
          .text()
          .trim()
        ).to.equal('feel good yo');

      statusMessage.update({ msg: 'send a salomi to your boy in the army' });

      expect(
        $('#statusBar .statusMessage').eq(0)
          .text()
          .trim()
        ).to.equal('send a salomi to your boy in the army');
    });
  });
});
