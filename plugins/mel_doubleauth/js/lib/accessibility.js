const ID_FEEDBACK = 'da__feedback';
const KEY_ENTER = 'Enter';

/**
 * Annonce un message aux technologies d'assistance via la région `role="alert"` de la page.
 *
 * @param {string} message Message à annoncer
 * @returns {void}
 */
export function announce(message) {
  const region = document.getElementById(ID_FEEDBACK);

  if (!region) return;

  // Vider puis remplir force une nouvelle annonce même si le message est identique.
  region.textContent = '';
  region.textContent = message;
}

/**
 * Déclenche une action sur la touche Entrée, comme le ferait un formulaire natif.
 *
 * Les champs du design system sont des composants à Shadow DOM : le navigateur
 * n'applique pas la soumission implicite à leur input interne.
 *
 * @param {HTMLElement} element Élément à écouter
 * @param {() => void} callback Action à exécuter
 * @returns {void}
 */
export function on_enter(element, callback) {
  element.addEventListener('keydown', (e) => {
    const has_modifier = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;

    if (e.key !== KEY_ENTER || e.isComposing || has_modifier) return;

    e.preventDefault();
    callback();
  });
}

/**
 * Affiche une erreur sur un champ du design system, l'annonce et lui redonne le focus.
 *
 * @param {HTMLElement & {setErrorState: (message: string) => unknown}} field Champ en erreur
 * @param {string} message Message d'erreur
 * @returns {void}
 */
export function reject_field(field, message) {
  field.querySelector('[slot="error"]')?.remove();
  field.setErrorState(message);
  announce(message);
  field.focus();
}

/**
 * Retire l'état d'erreur d'un champ du design system.
 *
 * @param {HTMLElement} field Champ concerné
 * @returns {void}
 */
export function clear_field_state(field) {
  field.removeAttribute('state');
}
