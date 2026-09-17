(() => {
/**
 * Gère le SSO et les échanges AJAX entre Roundcube et l'instance Wekan
 * embarquée en iframe (connexion automatique, création/vérification de
 * tableaux, synchronisation du token de session Meteor).
 * @class
 */
class Wekan {
  /**
   * Accès à l'objet global `mel_metapage` (fonctions AJAX/URL du plugin
   * mel_metapage).
   * @private
   * @type {Object}
   * @readonly
   */
  get #_melMetapage() {
    const mel_metapage = window.mel_metapage || {};

    if (!mel_metapage)
      console.error('### [Wekan/constructor] Impossible de trouver mel_metapage !', mel_metapage);

    return mel_metapage;
  }

  /**
   * Calcule les clés `localStorage` (`tokenName`, `tokenId`) utilisées par
   * Meteor pour stocker le token et l'identifiant de session, à partir de
   * l'origine courante.
   */
  constructor() {
    const rcmail = window.rcmail || null;

    if (!rcmail) {
      console.error('### [Wekan/constructor] Impossible de trouver rcmail !', rcmail);
      return;
    }

    const origin = this.#_getOrigine();
    this.tokenName = `Meteor.loginToken:${origin}:/${rcmail.env.wekan_storage_end}`;
    this.tokenId = `Meteor.userId:${origin}:/${rcmail.env.wekan_storage_end}`;
  }

  /**
   * Calcule l'origine courante (protocole + hôte + chemin) normalisée avec
   * un `/` final.
   * @private
   * @returns {string} Origine normalisée
   */
  #_getOrigine() {
    let origin = window.location.origin + window.location.pathname;

    if (origin.at(-1) !== '/') origin += '/';

    return origin;
  }

  /**
   * Authentifie l'utilisateur Roundcube courant auprès de Wekan et stocke
   * le token Meteor obtenu dans `localStorage`.
   *
   * Note : la réponse est encodée en JSON à deux niveaux (`datas` puis
   * `datas.content`), d'où le double `JSON.parse`.
   *
   * @returns {Promise<boolean>} `true` si le code HTTP est 200 et que le
   * token a bien été enregistré dans `localStorage`
   */
  login() {
    return this.#_melMetapage.Functions.post(
      this.url('login'),
      {
        currentUser: true,
      },
      (datas) => {
        try {
          datas = JSON.parse(datas);
          datas = JSON.parse(datas.content);
          const token = this.tokenName;

          localStorage.setItem(token, datas.authToken);
        } catch (error) {
          return error;
        }
      },
    ).then(
      (e) =>
        JSON.parse(e).httpCode === 200 &&
        localStorage.getItem(this.tokenName) !== null,
    );
  }

  /**
   * Indique si l'utilisateur possède déjà un token Meteor valide en
   * `localStorage`.
   * @returns {boolean} `true` si un token est présent
   */
  isLogged() {
    return localStorage.getItem(this.tokenName) !== null;
  }

  /**
   * Crée un tableau Wekan pour l'utilisateur courant.
   *
   * @param {string} title Titre du tableau
   * @param {boolean} isPublic Visibilité publique du tableau
   * @param {?string} [color=null] Couleur du tableau
   * @returns {Promise<*>} Réponse brute de l'action `create_board`
   */
  create_board(title, isPublic, color = null) {
    return this.#_melMetapage.Functions.post(
      this.url('create_board'),
      {
        _title: title,
        _isPublic: isPublic,
        _color: color,
      },
      (_) => {
        return _;
      },
    );
  }

  /**
   * Met à jour le statut de l'utilisateur courant côté Wekan.
   * @returns {Promise<*>} Réponse brute de l'action `update_user_status`
   */
  update_user_status() {
    return this.#_melMetapage.Functions.post(
      this.url('update_user_status'),
      (_) => {
        return _;
      },
    );
  }

  /**
   * Vérifie l'existence du tableau de test Wekan.
   *
   * Note : l'identifiant de tableau (`_board`) est actuellement en dur.
   *
   * @returns {Promise<*>} Réponse brute de l'action `check_board`
   */
  check_board() {
    return this.#_melMetapage.Functions.post(
      this.url('check_board'),
      {
        _board: 'pSSkHJ6wb64ZS2gxE',
      },
      (_) => {
        return _;
      },
    );
  }

  /**
   * Construit l'URL d'une action Wekan.
   * @param {string} task Nom de l'action Wekan ciblée
   * @returns {string} URL complète de l'action
   */
  url(task) {
    return this.#_melMetapage.Functions.url('wekan', task);
  }
}


window.wekan = new Wekan();

const $ = window.$ || null;

if (!$) {
  console.error('### [Wekan] Impossible de trouver la classe Jquery !', $);
  return;
}

$(document).ready(async () => {
  const rcmail = window.rcmail || null;
  const wekan = window.wekan || null;

  if (!rcmail) {
    console.error('### [Wekan] Impossible de trouver rcmail !', rcmail);
    return;
  }

  if (!wekan) {
    console.error('### [Wekan] Impossible de trouver la classe Wekan !', wekan);
    return;
  }

  if (
    rcmail.env.task === 'wekan' &&
    (rcmail.env.action === '' || rcmail.env.action === 'index')
  ) {
    $('#wekan-iframe')[0].src =
      rcmail.env.wekan_startup_url !== null &&
      rcmail.env.wekan_startup_url !== undefined
        ? rcmail.env.wekan_startup_url
        : rcmail.env.wekan_base_url;

    if (!wekan.isLogged()) {
      if (await wekan.login()) {
        window.addEventListener('storage', (e) => {
          if (e.key === wekan.tokenId) {
            if (
              rcmail.env.wekan_startup_url !== null &&
              rcmail.env.wekan_startup_url !== undefined
            )
              $('#wekan-iframe')[0].src = rcmail.env.wekan_startup_url;
            else $('#wekan-iframe')[0].contentWindow.location.reload();
          }
        });

        if (
          rcmail.env.wekan_startup_url !== null &&
          rcmail.env.wekan_startup_url !== undefined
        )
          $('#wekan-iframe')[0].src = rcmail.env.wekan_startup_url;
      } else
        rcmail.display_message(
          'Impossible de se connecter au kanban !',
          'error',
        );
    }
  }
});
})();