import _ from 'underscore';
import $ from 'jquery';
import sanitizeHtml from 'sanitize-html';
import { setDeepValue } from '../utils/object';
import { View } from 'backbone';

export default class baseVw extends View {
  constructor(options = {}) {
    super(options);
    this._childViews = [];
    this._unregisterFromParent = true;
    this._removed = false;
    this._state = {};
    this.setState((options.initialState || {}), { renderOnChange: false });
  }

  _getCheckboxGroupData($fields) {
    const data = [];

    $fields.each((index, field) => {
      const val = typeof field.value === 'string' ? sanitizeHtml(field.value) : field.value;
      if (field.checked) data.push(val);
    });

    return data;
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
      selector : this.$(selector ||
        `select[name], input[name],
        textarea[name]:not([class*="trumbowyg"]),
        div[contenteditable][name]`
      );
    const data = {};

    $formFields.each((index, field) => {
      const $field = $(field);
      const varType = $field.data('var-type');

      let val = $field.val();

      if (field.tagName.toUpperCase() === 'DIV') {
        val = field.innerHTML;
      }

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

      const name = $field.attr('name');
      const isCheckboxGroup = field.type === 'checkbox' &&
        name.endsWith('[]');
      const checkboxGroupName = name.slice(0, name.length - 2);

      if (name.indexOf('.') !== -1) {
        let deepVal = val;
        let deepName = name;

        if (isCheckboxGroup) {
          deepVal = this._getCheckboxGroupData($formFields.filter(`[name="${name}"]`));
          deepName = checkboxGroupName;
        } else if (field.type === 'checkbox') {
          deepVal = field.checked;
        }

        // handle nested model
        setDeepValue(data, deepName, deepVal);
      } else if (isCheckboxGroup) {
        data[checkboxGroupName] =
          this._getCheckboxGroupData($formFields.filter(`[name="${name}"]`));
      } else if (field.type === 'checkbox') {
        data[name] = field.checked;
      } else {
        data[name] = typeof val === 'string' ? sanitizeHtml(val) : val;
      }
    });

    return data;
  }

  /**
   * Will scroll to the given element. The element must be within this view.
   * @param {string|object} selector - A CSS selector or a DOM element or a jQuery object.
   */
  scrollTo(selector) {
    if (!selector) {
      throw new Error('Please provide a selector');
    }

    if (!(typeof selector === 'string' ||
      _.isElement(selector) || selector instanceof $)) {
      throw new Error('The selector must be a string, DOM element or jQuery object.');
    }

    let $el;

    if (typeof selector === 'string') {
      $el = this.getCachedEl(selector);
    } else if (!(selector instanceof $)) {
      $el = $(selector);
    }

    $el[0].scrollIntoView();
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

  /**
   * Returns a given jQuery Element or a locally cached version for optimization.
   * NOTE: Ensure that child views call super.render() in their render function to clear the cache
   *       since the DOM elements in the cache will then be stale references.
   * @param {selector} string - The jQuery selector for the Element.
   *
   * @return {element} JQuery The element(s) found in the View's Dom or the View's Cache
   */
  getCachedEl(selector) {
    let element;

    // Ensure we have our cached elements map.
    if (!this._cachedElementMap) {
      this._cachedElementMap = new Map();
    }

    // If the cache has the element, we shall use it.
    if (this._cachedElementMap.has(selector)) {
      element = this._cachedElementMap.get(selector);
    } else {
      // The cache does not not have the element, therefore query with jQuery and cache it.
      element = this.$(selector);
      this._cachedElementMap.set(selector, element);
    }

    return element;
  }

  /**
   * Clears the cached elements map.
   */
  clearCachedElementMap() {
     // Clear the cache map.
    if (this._cachedElementMap) {
      this._cachedElementMap.clear();
    }
  }

  /**
   * Returns this view's state object.
   */
  getState() {
    return this._state;
  }

  /**
   * Sets this view's state object.
   * @param {object} state - The new state data. By default, this is merged into
   *   the existing state. To replace the state use the replace option.
   * @param {object} options
   * @param {boolean} [options.renderOnChange = true] - If true, will re-render the view
   *   if the resulting state changes. Setting this to false should be done very judiciously
   *   since it will result in your view not being in sync with its state.
   * @param {boolean} [options.replace = false] - If true, will replace the entire state
   *   with the given state. Otherwise, the given state will be merged in.
   * @return {object} The create child view instance.
   */
  setState(state = {}, options = {}) {
    const opts = {
      renderOnChange: true,
      replace: false,
      ...options,
    };
    let newState;

    if (typeof state !== 'object') {
      throw new Error('The state must be provided as an object.');
    }

    if (opts.replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      if (opts.renderOnChange) this.render();
    }

    return this;
  }

  /** It is necessary to call super.render() in child views' render methods if using
   *  getCachedEl()
   *  @param {this} Render requires this to be returned.
   */
  render() {
    this.clearCachedElementMap();
    return this;
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
