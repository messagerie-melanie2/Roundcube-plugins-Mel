import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';

/**
 * Récupère l'url de base de la plateforme de visio (variable d'env
 * `visio_gouv_base_url`, définie par le plugin côté serveur).
 *
 * @returns {?string} Url de base, ou `null`/`undefined` si non configurée
 */
export function get_visio_base_url() {
  return (get_visio_base_url._url ??= MelObject.Empty().get_env(
    'visio_gouv_base_url',
  ));
}

/**
 * Récupère l'url d'une visio
 * @param {string} text Récupère l'url de la visio avec sa room parmis un texte
 * @returns {?string}
 */
export function getVisioUrlFromText(text) {
  const base_url = get_visio_base_url();

  if (!base_url) return null;

  const start = text.indexOf(base_url);

  if (start === -1) return null;

  // Seule la première url est conservée, les suivantes sont ignorées.
  const [url] = text.slice(start).split(/\s/);

  return url.length > base_url.length + 1 ? url : null;
}

/**
 * Indique si un texte est une url de visio « propre » : une url http(s)
 * valide, sans texte ni autre lien collé à côté.
 *
 * @param {?string} url - Url à vérifier
 * @returns {boolean}
 */
export function is_clean_visio_url(url) {
  return is_allowed_url(url) && !/\s/.test(url.trim());
}

/**
 * Retire de la localisation la première url de visio ; le reste (texte,
 * autres liens) est destiné à une localisation de type présentiel.
 *
 * @param {string} location - Localisation collée
 * @param {string} url - Url de visio retenue
 * @returns {string} Reste de la localisation, sans espaces superflus
 */
export function get_location_without_visio(location, url) {
  return location.replace(url, EMPTY_STRING).trim();
}

/** Protocoles autorisés à l'ouverture d'une salle. */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
/**
 * Indique si une url peut être ouverte : absolue et en http(s).
 *
 * @param {?string} url - Url à vérifier
 * @returns {boolean}
 */
export function is_allowed_url(url) {
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(url).protocol);
  } catch {
    // Url relative ou malformée : refusée.
    return false;
  }
}
