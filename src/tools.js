// requires: jquery 3.4, config.js

function templateFromHtml(innerHtml, trim=true) {
  // Return a new template element with `innerHtml` as its contents
  // Whitespace is trimmed from `innerHtml` if `trim` is `true`

  const template = document.createElement('template');
  template.innerHTML = trim ? innerHtml.trim() : innerHtml;
  return template;
}

function insertTemplateInto(parentElement, template, clearParentFirst=true) {
  if (clearParentFirst) parentElement.innerHTML = "";
  parentElement.appendChild(template.content.cloneNode(true));
}

function insertAfter(elementToAppend, appendAfterThis, parent) {
  // Insert DOM element `elementToAppend` into an element`parent` after
  // element `appendAfterThis`

  if (appendAfterThis.nextSibling) {
    // console.log('insert', this.insertProxy, 'after', card);
    parent.insertBefore(elementToAppend, appendAfterThis.nextSibling);
  }
  else {
    // console.log('insert', this.insertProxy, 'at end');
    parent.appendChild(elementToAppend);
  }
}

function displayControls(selector, element, hiddenClass=d.hiddenClass) {
  // Returns an object with functions to add (hide), remove (unhide) and toggle
  // the `hiddenClass` into the classlist of elements fitting `selector`
  // or to `element` if `selector` is `null`

  const target = selector != null ? $(selector) : $(element);

  return {
    unhide: () => target.removeClass(hiddenClass),
    hide: () => target.addClass(hiddenClass),
    toggle: () => target.toggleClass(hiddenClass)
  }
}

class AsyncRefsQueue {
  constructor() {
    this.queue = [];
    this.refs = [];
  }

  removeByRefIndex(refIndex) {
    this.refs[refIndex] = undefined;
    this.queue.splice(
      this.getQueueIndexByRefIndex(refIndex),
      1
    );
  }

  getQueueIndexByRefIndex(refIndex) {
    return this.queue.indexOf(refIndex);
  }

  addRef(ref) {
    this.refs.push(ref);
    const refIndex = this.refs.length - 1;
    this.queue.push(refIndex);

    return {
      remove: () => this.removeByRefIndex(refIndex),
      getQueueIndex: () => this.getQueueIndexByRefIndex(refIndex)
    }
  }
}

function copyTextareaToClipboard(target) {
  // Copies the full text of the `target` textarea element to the clipboard
  // and restores the previous selection
  // If a block of text was highlighted then it will blink when selecting
  const storedSelection = [target.selectionEnd, target.selectionStart];
  target.select();
  document.execCommand("copy");
  [target.selectionEnd, target.selectionStart] = storedSelection;
}