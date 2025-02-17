import {
  EButtonVariation,
  HTMLMelButton,
} from '../lib/html/JsHtml/CustomAttributes/HTMLMelButton.js';

let primary = HTMLMelButton.CreateNode({
  contentsNode: document.createTextNode('Primary'),
});
let secondary = HTMLMelButton.CreateNode({
  contentsNode: document.createTextNode('Secondary'),
  variation: EButtonVariation.secondary,
});
let error = HTMLMelButton.CreateNode({
  contentsNode: document.createTextNode('Danger'),
  variation: EButtonVariation.danger,
});
let loading = HTMLMelButton.CreateNode({
  contentsNode: document.createTextNode('Loading'),
  loading: true,
});

$('body').prepend(loading);
$('body').prepend(error);
$('body').prepend(secondary);
$('body').prepend(primary);
