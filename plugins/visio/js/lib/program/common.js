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

  if (base_url === null) return null;

  const link = text
    .replace(base_url, EMPTY_STRING)
    ?.split?.('/')?.[1]
    ?.split?.(' ')?.[0];

  if (link === null) return null;

  return `${base_url}/${link}`;
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
