require('./index.css');

const linkIcon = require('./icons/link.js');

/**
 * Link Inline Tool for Editor.js
 * Supported config:
 *     * shortcut {string} (Default: CMD+L)
 *     * placeholder {string} (Default: Enter URL)
 *     * targets {string[]} (Default: Link.TARGETS)
 *     * defaultTarget {string} (Default: _self)
 *     * relations {string[]} (Default: Link.RELATIONS)
 *     * defaultRelation {string} (Default: '')
 *     * validate {boolean} (Default: true)
 *
 * @class Link
 * @typedef {Link}
 */
export default class Link {
  /**
   * To notify Editor.js that this is an inline tool
   *
   * @static
   * @readonly
   * @type {boolean}
   */
  static get isInline() {
    return true;
  }

  /**
   * Title for Inline Tool
   *
   * @readonly
   * @type {string}
   */
  get title() {
    return 'Hyperlink';
  }

  /**
   * All supported link targets
   *
   * @static
   * @readonly
   * @type {string[]}
   */
  static get TARGETS() {
    return ['_self', '_blank', '_parent', '_top'];
  }

  /**
   * Default link target
   *
   * @static
   * @readonly
   * @type {string}
   */
  static get DEFAULT_TARGET() {
    return '_self';
  }

  /**
   * All supported link relations
   *
   * @static
   * @readonly
   * @type {string[]}
   */
  static get RELATIONS() {
    return [
      '', 'alternate', 'author', 'bookmark', 'canonical', 'external', 'help', 'license', 'manifest', 'me', 'next', 
      'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag'
    ];
  }

  /**
   * Default link relation
   *
   * @static
   * @readonly
   * @type {string}
   */
  static get DEFAULT_RELATION() {
    return '';
  }

  /**
   * Automatic sanitize config for Editor.js
   *
   * @static
   * @readonly
   * @type {{ a: {} }}
   */
  static get sanitize() {
    return {
      a: {
        class: 'ce-link',
        href: true,
        target: true,
        rel: true,
      }
    };
  }

  /**
   * Validate the URL
   *
   * @param {string} url
   * @returns {boolean}
   */
  _validateURL(url) {
    if (this._config.validate || this._config.validate === undefined) {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return !!pattern.test(url);
    }
    return true;
  }

  /**
   * Creates an instance of Link.
   *
   * @constructor
   * @param {{ api: {}; config: {}; readOnly: boolean; }} props
   */
  constructor({ api, config, readOnly }) {
    this._api = api;
    this._config = config;
    this._readOnly = readOnly;
    this._CSS = {
      inline: api.styles.inlineToolButton,
      inlineActive: api.styles.inlineToolButtonActive,
      inlineToolbar: '.ce-inline-toolbar',
      inlineToolbarActive: '.ce-inline-toolbar--showed',
      wrapper: 'ce-link',
      actionContainer: 'ce-link-action-container',
      urlInputHelper: 'ce-link-input-helper',
      urlOptions: 'ce-link-options',
      submitButton: 'ce-link-submit-button',
      resetButton: 'ce-link-reset-button',
    };

    this._tag = 'A';
    this._button = null;
    this._state = {
      isActive: false,
      isSubmitted: false,
      submitType: 'remove',
      range: null,
      anchor: null,
      href: null,
      target: null,
      rel: null
    };
  }

  /**
   * All available link targets
   * - Finds intersection between supported and user selected types
   *
   * @readonly
   * @type {string[]}
   */
  get availableTargets() {
    return this._config.targets ? Link.TARGETS.filter(
      (target) => this._config.targets.includes(target),
    ) : Link.TARGETS;
  }

  /**
   * User's default link target
   * - Finds union of user choice and the actual default
   *
   * @readonly
   * @type {string}
   */
  get userDefaultTarget() {
    if (this._config.defaultTarget) {
      const userSpecified = this.availableTargets.find(
        (target) => target === this._config.defaultTarget,
      );
      if (userSpecified) {
        return userSpecified;
      }
      // eslint-disable-next-line no-console
      console.warn('(ง\'̀-\'́)ง Link Tool: the default target specified is invalid');
    }
    return Link.DEFAULT_TARGET;
  }

  /**
   * All available link relations
   * - Finds intersection between supported and user selected types
   *
   * @readonly
   * @type {string[]}
   */
  get availableRelations() {
    return this._config.relations ? Link.RELATIONS.filter(
      (relation) => this._config.relations.includes(relation),
    ) : Link.RELATIONS;
  }

  /**
   * User's default link relation
   * - Finds union of user choice and the actual default
   *
   * @readonly
   * @type {string}
   */
  get userDefaultRelation() {
    if (this._config.defaultRelation) {
      const userSpecified = this.availableRelations.find(
        (relation) => relation === this._config.defaultRelation,
      );
      if (userSpecified) {
        return userSpecified;
      }
      // eslint-disable-next-line no-console
      console.warn('(ง\'̀-\'́)ง Link Tool: the default relation specified is invalid');
    }
    return Link.DEFAULT_RELATION;
  }

  /**
   * Shortcut for the Inline Tool
   *
   * @readonly
   * @type {string}
   */
  get shortcut() {
    return this._config.shortcut || 'CMD+L';
  }

  /**
   * Render HTML element of the button for Inline Toolbar
   *
   * @returns {HTMLElement}
   */
  render() {
    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.classList.add(this._CSS.inline);
    this._button.innerHTML = linkIcon;
    return this._button;
  }

  /**
   * Remove existing link from the selection
   * 
   * @param {HTMLElement} linkNode
   */
  _removeExistingLink(linkNode) {
    this._api.selection.expandToTag(linkNode);

    const sel = window.getSelection();
    const range = sel.getRangeAt(0);

    const linkContent = range.extractContents();
    linkNode.parentNode.removeChild(linkNode);
    range.insertNode(linkContent);

    // Restore selection
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * To wrap the selection with inline tool
   *
   * @param {Range} range
   */
  _addLink(range) {
    // Create a new link for the selected range
    const linkNode = document.createElement(this._tag);
    linkNode.classList.add(this._CSS.wrapper);
    linkNode.appendChild(range.extractContents());
    linkNode.href = this._state.href;
    linkNode.target = this._state.target;
    linkNode.rel = this._state.rel;
    range.insertNode(linkNode);
    this._api.selection.expandToTag(linkNode);
  }

  /**
   * Action for any of these button presses -> 
   *    * Inline tool button click (show/hide menu)
   *    * Add button click (Add a new hyperlink)
   *    * Remove button click (Removes an existing hyperlink)
   * 
   * @param {Range} range
   */
  surround(range) {
    if (this._state.isSubmitted) {
      // Check and remove if a link already exists
      const linkNode = this._api.selection.findParentTag(this._tag);
      if (linkNode) {
        this._removeExistingLink(linkNode);
      }

      // Add link, if requested
      if (this._state.submitType === 'add') {
        this._addLink(range);
      }
    } else {
      // On click, Toggle link action menu 
      this._state.isActive = !this._state.isActive;

      // Save range to make it available for Add/Remove buttons
      this._state.range = range;
      this._button.classList.toggle(this._CSS.inlineActive, this._state.isActive);
    }
  } 

  /**
   * To check whether to open/close link action menu, upon text selection
   */
  checkState() {
    if (this._state.isActive) {
      // Requested for opening link action menu
      const linkNode = this._api.selection.findParentTag(this._tag);
      this.showActions(linkNode);
    } else{
      // Requested for closing link action menu
      this.hideActions();
    }
  }

  /**
   * Function to add an option to Select node
   *
   * @param {HTMLSelectElement} selectNode
   * @param {string} text
   * @param {string} value
   */
  _addSelectOption(selectNode, text, value) {
    const option = document.createElement('option');
    option.text = text;
    option.value = value;
    selectNode.add(option);
  }

  /**
   * Inline tool actions menu
   *
   * @returns {HTMLElement}
   */
  renderActions() {
    // URL Input
    this.linkInput = document.createElement('input');
    this.linkInput.placeholder = this._config.placeholder || 'Enter URL';

    // URL Input Helper (only for invalid URLs)
    this.inputHelper = document.createElement('div');
    this.inputHelper.classList.add(this._CSS.urlInputHelper);
    this.inputHelper.innerText = 'Invalid URL';
    this.inputHelper.hidden = true;

    // Link Target Menu
    this.targetMenu = document.createElement('select');
    this.availableTargets.map((target) => {
      this._addSelectOption(this.targetMenu, target, target);
    });

    // Link Rel Menu
    this.relMenu = document.createElement('select');
    this.availableRelations.map((rel) => {
      this._addSelectOption(this.relMenu, rel === '' ? '-- Empty --' : rel, rel);
    });

    // Add Link Button
    this.submitButton = document.createElement('button');
    this.submitButton.classList.add(this._CSS.submitButton);
    this.submitButton.type = 'button';
    this.submitButton.innerHTML = "Add";

    // Remove Link Button
    this.resetButton = document.createElement('button');
    this.resetButton.classList.add(this._CSS.resetButton);
    this.resetButton.type = 'button';
    this.resetButton.innerHTML = "Remove";
    this.resetButton.hidden = true;

    // Link Options (Target, Relation and Submit button)
    const linkOptions = document.createElement('div');
    linkOptions.classList.add(this._CSS.urlOptions);
    linkOptions.appendChild(this.targetMenu);
    linkOptions.appendChild(this.relMenu);
    linkOptions.appendChild(this.submitButton);
    linkOptions.appendChild(this.resetButton);

    // Menu container
    this.linkMenuContainer = document.createElement('div');
    this.linkMenuContainer.classList.add(this._CSS.actionContainer);
    this.linkMenuContainer.hidden = true;
    this.linkMenuContainer.appendChild(this.linkInput);
    this.linkMenuContainer.appendChild(this.inputHelper);
    this.linkMenuContainer.appendChild(linkOptions);

    return this.linkMenuContainer;
  }

  /**
   * To show actions when link inline tool is selected
   *
   * @param {HTMLElement} anchor
   */
  showActions(anchor) {
    const { href, target, rel} = anchor || {};

    // Set button's visibility
    this.submitButton.hidden = !!anchor;
    this.resetButton.hidden = !anchor;

    // Initial values
    this.linkInput.value = href || '';
    this.targetMenu.value = target || this.userDefaultTarget;
    this.relMenu.value = rel || this.userDefaultRelation;

    this.submitButton.onclick = () => {
      // Validate URL
      const isValidUrl = this._validateURL(this.linkInput.value);

      if (isValidUrl) {
        this.inputHelper.hidden = true;

        // Capturing current values
        this._state.anchor = null;
        this._state.href = this.linkInput.value;
        this._state.target = this.targetMenu.value;
        this._state.rel = this.relMenu.value;
        this._state.submitType = 'add';
        this._state.isSubmitted = true;
  
        // Trigger surround to add the link
        this.surround(this._state.range);
  
        // Hide toolbar on submit
        const inlineToolbar = this.submitButton.closest(this._CSS.inlineToolbar);
        inlineToolbar.classList.remove(this._CSS.inlineToolbarActive);
      } else {
        this.inputHelper.hidden = false;
      }
    };

    this.resetButton.onclick = () => {
      // Capturing current values
      this._state.anchor = anchor;
      this._state.submitType = 'remove';
      this._state.isSubmitted = true;

      // Trigger surround to remove the link
      this.surround(this._state.range);

      // Hide toolbar on submit
      const inlineToolbar = this.resetButton.closest(this._CSS.inlineToolbar);
      inlineToolbar.classList.remove(this._CSS.inlineToolbarActive);
    };

    // Show actions menu
    this.linkMenuContainer.hidden = false;
  }

  /**
   * To hide actions when link inline tool is un-selected
   */
  hideActions() {
    this.submitButton.onclick = null;
    this.resetButton.onclick = null;
    this.linkMenuContainer.hidden = true;
  }

  /**
   * To clear actions when inline toolbar closes
   */
  clear() {
    this.hideActions();
  }
}