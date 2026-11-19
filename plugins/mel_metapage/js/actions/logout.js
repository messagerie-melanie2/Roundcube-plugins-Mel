const ID_MESSAGE_CONTAINER = 'login__addons';

/**
 * Crée l'alerte expliquant pourquoi la double authentification a échoué.
 *
 * @param {string} reason Raison du refus transmise par le serveur (texte brut)
 * @returns {HTMLElement} Alerte prête à être insérée
 */
function create_da_alert(reason) {
  const settings_url = mel_metapage.Functions.url(
    'settings',
    'plugin.mel_doubleauth',
    { _force_bnum: 1 },
  );

  const alert = document.createElement('bnum-alert-error');

  // La raison vient de l'URL : elle est insérée en texte, jamais en HTML.
  if (typeof reason === 'string' && reason !== 'true') {
    const reason_element = document.createElement('strong');
    reason_element.textContent = reason;
    alert.append(reason_element, document.createElement('br'));
  }

  const explanation = document.createElement('span');
  explanation.innerHTML = `Connexion impossible pour des questions de sécurité.<br />
    La double authentification est obligatoire afin d'accéder à votre BNum depuis internet pour votre compte.
    Afin de la mettre en place, merci de vous connecter depuis le RIE ou en VPN puis de vous rendre à l'adresse suivante :
    <a href="${settings_url}">Double Authentification</a>.`;
  alert.append(explanation);

  return alert;
}

$(document).ready(() => {
  if (!rcmail.env.da_logout_message) return;

  document
    .getElementById(ID_MESSAGE_CONTAINER)
    ?.prepend(create_da_alert(rcmail.env.da_logout_message));

  rcmail.env.da_logout_message = undefined;
});
