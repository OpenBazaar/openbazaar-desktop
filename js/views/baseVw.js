import { View } from 'backbone';

export default class BaseVw extends View {
  constructor(options) {
    super(options);
    this._childViews = [];
    this._unregisterFromParent = true;
    this._removed = false;
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
      throw new Error('Please provide a ChildView class (not an instance).');
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
