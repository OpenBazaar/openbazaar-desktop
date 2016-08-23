import $ from 'jquery';
import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import SimpleMessageModal from './modals/SimpleMessage';
import SocialAccount from '../models/SocialAccount';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.listenTo(app.profile.get('social'), 'add', this.render, this);
    this.listenTo(app.profile.get('social'), 'remove', this.onRemoveSocial, this);
  }

  events() {
    return {
      'click input[type=submit]': 'onSaveForm',
      'click input[type=reset]': 'onResetForm',
      'click .js-AddSocial': 'onClickAddSocial',
      'click .js-RemoveSocial': 'onClickRemoveSocial',
      'change input[name], textarea[name], select[name]': 'onChangeFormField',
    };
  }

  className() {
    return 'testProfilePage';
  }

  onSaveForm(e) {
    e.preventDefault();
    this.saveForm();
  }

  onChangeFormField(e) {
    // when the UI changes, update the model
    const $field = $(e.target);
    const name = $field.attr('name');
    const leftBracketIndex = name.indexOf('[');

    if (leftBracketIndex !== -1) {
      // nested collection
      const nestedIndex = parseInt(name.slice(leftBracketIndex + 1, name.indexOf(']')), 10);
      const attr = name.slice(name.indexOf('.') + 1);
      const topAttr = name.slice(0, leftBracketIndex);
      const model = app.profile.get(topAttr).at(nestedIndex);

      if (model) {
        model.set(attr, e.target.value);
      } else {
        app.profile.get(topAttr)
          .add(new SocialAccount({ attr: e.target.value }));
      }
    } else {
      app.profile.set(name, e.target.value);
    }
  }

  onClickAddSocial() {
    app.profile.get('social')
      .add(new SocialAccount());
  }

  onClickRemoveSocial(e) {
    const index = $(e.target).parents('.socialAccount').index();
    const social = app.profile.get('social');

    social.remove(social.at(index));
  }

  onRemoveSocial() {
    // since the validation is index based and
    // removing alters the indexes in the collection,
    // we need to revalidate
    app.profile.set(app.profile.toJSON(), { validate: true });
    this.render();
  }

  saveForm() {
    const formSave = app.profile.save();

    if (formSave) {
      new Notification('Saving...', { silent: true }); // eslint-disable-line no-new

      formSave.done(() => {
        new Notification('Save complete', { silent: true }); // eslint-disable-line no-new
      }).fail((data) => {
        new SimpleMessageModal()
          .render()
          .open('There was an error saving the data.', data.reason || '');
      });
    }

    // render so errors are shown / cleared
    this.render();
  }

  onResetForm(e) {
    e.preventDefault();
    app.profile.reset();
    this.render();
  }

  render() {
    loadTemplate('testProfile.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
        socialTypes: app.profile.socialTypes,
        errors: app.profile.validationError || {},
      }));
    });

    return this;
  }
}
