# Link inline tool for Editor.js

This [Editor.js](https://editorjs.io/) inline tool enables users to add or remove a hyperlink. This takes inspiration from [editorjs-hyperlink](https://github.com/trinhtam/editorjs-hyperlink) and makes some adjustments.

A few points to note:
* This inline tool can be accessed from the Inline Toolbar (see [Preview](https://github.com/CoolBytesIN/editorjs-link?tab=readme-ov-file#preview)).
* The inline button functions as a toggle, allowing you to show or hide the action menu.
* When a link already exists in the selected text, the action menu automatically detects it and gives you the option to Remove it.

## Preview

![preview](https://api.coolbytes.in/media/handle/view/image/309/)

![add-link](https://api.coolbytes.in/media/handle/view/image/310/)

![remove-link](https://api.coolbytes.in/media/handle/view/image/311/)

## Installation

**Using `npm`**

```sh
npm install @coolbytes/editorjs-link
```

**Using `yarn`**

```sh
yarn add @coolbytes/editorjs-link
```

## Usage

Include it in the `tools` property of Editor.js config:

```js
const editor = new EditorJS({
  tools: {
    link: Link
  }
});
```

## Config Params

|Field|Type|Optional|Default|Description|
|---|---|---|---|---|
|shortcut|`string`|`Yes`|'CMD+L'|Shortcut to toggle link action menu|
|placeholder|`string`|`Yes`|'Enter URL'|Placeholder text for URL|
|targets|`string[]`|`Yes`|['_self', '_blank', '_parent', '_top']|All supported link targets|
|defaultTarget|`string`|`Yes`|'_self'|Preferred link target|
|relations|`string[]`|`Yes`|['', 'alternate', 'author', 'bookmark', 'canonical', 'external', 'help', 'license', 'manifest', 'me', 'next', 'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag']|All supported link rels|
|defaultRelation|`string`|`Yes`|''|Preferred link rel|
|validate|`boolean`|`Yes`|`true`|Defines if an URL should be validated|

&nbsp;

```js
const editor = EditorJS({
  tools: {
    link: {
      class: Link,
      config: {
        shortcut: 'CMD+L',
        placeholder: "Enter URL",
        targets: ['_self', '_blank', '_parent', '_top'],
        defaultTarget: '_self',
        relations: ['', 'alternate', 'author', 'bookmark', 'canonical', 'external', 'help', 'license', 'manifest', 'me', 'next', 'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag'],
        defaultRelation: '',
        validate: true
      }
    }
  }
});
```

## Output data

The block output would include a hyperlink (`<a>` tag) with `ce-link` CSS class.

Example for [Paragraph Tool](https://github.com/editor-js/paragraph):

```json
{
  "type": "paragraph",
  "data": {
    "text": "This is some <a class=\"ce-link\" href=\"https://example.com\" target=\"_self\" rel=\"alternate\">hyperlink</a> to demonstrate."
  }
}
```