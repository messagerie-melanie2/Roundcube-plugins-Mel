import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';

/**
 * Séparateur entre l'url de la salle et ses données téléphoniques dans une
 * localisation d'évènement : `url (numéro | #pin)`.
 * @type {string}
 */
const PHONE_SEPARATOR = '(';

/**
 * Récupère l'url de base de la plateforme de visio (variable d'env
 * `visio_gouv_base_url`, définie par le plugin côté serveur).
 *
 * @returns {?string} Url de base, ou `null`/`undefined` si non configurée
 */
export function get_visio_base_url() {
  return MelObject.Empty().get_env('visio_gouv_base_url');
}

/**
 * Indique si un texte (localisation d'évènement, lien…) désigne une salle de
 * la plateforme de visio. Source de vérité unique de cette détection : ne
 * dépend pas de la présence du global `WebconfLink`.
 *
 * @param {?string} url - Texte à tester
 * @returns {boolean} `true` si le texte contient l'url de base de la visio
 *
 * @example
 * is_visio_url('https://visio.numerique.gouv.fr/abc-defg-hij'); // true
 */
export function is_visio_url(url) {
  const base_url = get_visio_base_url();

  return !!url && !!base_url && url.includes(base_url);
}

/**
 * Construit la localisation d'évènement d'une salle, au format attendu par
 * {@link VisioWebconfLink} : `url (numéro | #pin)`, ou l'url seule si la
 * salle n'a pas de données téléphoniques.
 *
 * @param {Object} room - Salle renvoyée par l'API
 * @param {string} room.url - Url de la salle
 * @param {{phone_number?: string, pin_code?: string}} [room.telephony] - Accès téléphonique
 * @returns {string} Localisation de l'évènement
 *
 * @example
 * format_visio_location({ url, telephony: { phone_number: '0102', pin_code: '42' } });
 * // => 'https://… (0102 | #42)'
 */
export function format_visio_location({ url, telephony }) {
  const { phone_number, pin_code } = telephony ?? {};

  return phone_number && pin_code
    ? `${url} ${PHONE_SEPARATOR}${phone_number} | #${pin_code})`
    : url;
}

/**
 * Lien de webconférence vers une salle de la plateforme de visio.
 *
 * Hérite du global `WebconfLink` (script classique de mel_metapage) : vaut
 * `null` si ce global n'est pas chargé dans la page courante.
 *
 * @type {?typeof WebconfLink}
 */
export const VisioWebconfLink =
  typeof WebconfLink === 'undefined'
    ? null
    : class VisioWebconfLink extends WebconfLink {
        #_url;
        #_roomName;
        #_phone;

        /**
         * @param {string} url - Localisation d'évènement (`url (numéro | #pin)` ou url seule)
         */
        constructor(url) {
          super(url);

          const { url: room_url, roomName, phone } =
            VisioWebconfLink.#_parse(url);

          this.#_url = room_url;
          this.#_roomName = roomName;
          this.#_phone = phone;
        }

        /**
         * Url de la salle, sans les données téléphoniques.
         * @type {string}
         */
        get url() {
          return this.#_url;
        }

        /**
         * Nom (identifiant) de la salle, dernier segment de l'url.
         * @type {string}
         */
        get roomName() {
          return this.#_roomName;
        }

        /**
         * Accès téléphonique de la salle, ou `null` s'il n'y en a pas.
         * @type {?{number: string, pin: string}}
         */
        get phone() {
          return this.#_phone;
        }

        /**
         * Indique si la salle dispose d'un accès téléphonique.
         * @returns {boolean}
         */
        havePhoneData() {
          return this.#_phone !== null;
        }

        /**
         * Découpe une localisation `url (numéro | #pin)` en ses composants.
         * Opération inverse de {@link format_visio_location}.
         *
         * @param {string} text - Localisation à analyser
         * @returns {{url: string, roomName: string, phone: ?{number: string, pin: string}}}
         * @private
         */
        static #_parse(text) {
          const [raw_url, phone_data] = text.split(PHONE_SEPARATOR);
          const room_url = raw_url.trim();
          const roomName = room_url.replaceAll('//', EMPTY_STRING).split('/')[1];

          return {
            url: room_url,
            roomName,
            phone: phone_data ? VisioWebconfLink.#_parsePhone(phone_data) : null,
          };
        }

        /**
         * Analyse la partie téléphonique `numéro | #pin)` d'une localisation.
         *
         * @param {string} phone_data - Partie située après la parenthèse ouvrante
         * @returns {{number: string, pin: string}}
         * @private
         */
        static #_parsePhone(phone_data) {
          const [number, pin] = phone_data
            .replaceAll(')', EMPTY_STRING)
            .replaceAll('#', EMPTY_STRING)
            .split('|')
            .map((part) => part.trim());

          return { number, pin };
        }

        /**
         * Indique si une url désigne une salle de la plateforme de visio.
         *
         * @param {?string} url - Url à tester
         * @returns {boolean}
         * @see is_visio_url
         */
        static IsVisioUrl(url) {
          return is_visio_url(url);
        }

        /**
         * Url de base de la plateforme de visio.
         * @type {?string}
         * @see get_visio_base_url
         */
        static get VisioUrl() {
          return get_visio_base_url();
        }
      };
