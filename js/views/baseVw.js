import $ from 'jquery';
import { setDeepValue } from '../utils';
import { View } from 'backbone';

export default class baseVw extends View {
  constructor(options) {
    super(options);
    this._childViews = [];
    this._unregisterFromParent = true;
    this._removed = false;
  }

  /**
   * This is a way to handle most common scenarios of getting data
   * from your form into a JS object. This function is very much a
   * work in progress. If you have a change that would be appropriate
   * for most forms, feel free to add it here.
   *
   * If you need some custom form parsing that's specific to your form,
   * please override this method in your view.
   * TODO: give example of overriding this function, while still using it
   * for most of your form, but only customizing one field
   *
   * Since form values are pulled in as strings, if you want them to be
   * pulled in as a different type, add a data-var-type attribute to the
   * field, e.g. data-var-type="boolean". As of now, only 'boolean' and
   * 'number' are supported, but feel free to add in more if it makes sense
   * for them to be in such a common function.
   *
   * @param {string or jQuery object} selector - A css selector string used to
   *   obtain the fields to extract data from. The selector will be scoped to
   *   this view (i.e. this.$('<selector>')). The default is
   *   'select[name], input[name], textarea[name]'. Alternatively, you can provide
   *   a jQuery object, which gives you more control (and useful for caching).
   *
   * @return {object} An object created from the data in the form fields
   */
  getFormData(selector) {
    const $formFields = selector instanceof $ ?
      selector : this.$(selector || 'select[name], input[name], textarea[name]');
    const data = {};

    $formFields.each((index, field) => {
      const $field = $(field);
      const varType = $field.data('var-type');

      let val = $field.val();

      if (field.type === 'radio' && !field.checked) return;

      if (varType) {
        if (varType === 'number') {
          // If an empty string is provided or if the
          // number evaluates to NaN, we'll leave the value
          // as is, so client side validation can catch it
          // and the user can update it.
          if (val.trim() !== '') {
            const numberFromVal = Number(val);

            if (!isNaN(numberFromVal)) {
              val = numberFromVal;
            }
          }
        } else if (varType === 'boolean') {
          val = val === 'true';
        }
      }

      if (name.indexOf('[') !== -1) {
        // handle nested collection
        // for now not handling nested collection, please
        // manage manually
      } else if (name.indexOf('.') !== -1) {
        // handle nested model
        setDeepValue(data, name, val);
      } else {
        data[name] = val;
      }
    });

    return data;
  }

  /**
   * If you are creating child views within your view, call this method
   * to register them. This will ensure that they will have their remove
   * method called if the parent is removed.
   */
  registerChild(childView) {
    if (this._childViews.indexOf(childView) === -1) {
      this._childViews.push(childView);
      childView._parentView = this;
    }
  }

  /**
   * Opposite of registerChild. This method is automatically
   * called by remove. For all practical purposes, you probably
   * won't need to call this method directly.
   */
  unregisterChild(childView) {
    const index = this._childViews.indexOf(childView);

    if (index !== -1) {
      this._childViews.splice(index, 1);
      childView._parentView = null;
    }
  }

  /**
   * Shortcut method to instantiate a view and register it as a child.
   * @param {function} ChildView - The class of the child view (not instance).
   * @param {...*} args - Remaining arguments will be passed into the constuctor
   *   when instantiating the child view.
   * @return {object} The create child view instance.
   */
  createChild(ChildView, ...args) {
    if (typeof ChildView !== 'function') {
      throw new Error('Please provide a ChildView class.');
    }

    const childView = new ChildView(...args);
    this.registerChild(childView);

    return childView;
  }

  delegateEvents() {
    if (this._childViews) {
      this._childViews.forEach((view) => {
        view.delegateEvents();
      });
    }

    super.delegateEvents();
  }

  // Will call the remove method of any child views.
  remove() {
    for (let i = 0; i < this._childViews.length; i++) {
      // no need to unregister child from parent,
      // since the parent is also being removed
      this._childViews[i]._unregisterFromParent = false;
      this._childViews[i].remove();
    }

    if (this._parentView && this._unregisterFromParent) {
      this._parentView.unregisterChild(this);
    }

    super.remove();

    this._removed = true;
  }

  isRemoved() {
    return this._removed;
  }
}
