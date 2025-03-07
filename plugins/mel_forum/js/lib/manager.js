import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';
import {
  MelDialog,
  DialogPage,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { CursorUtils } from '../../../mel_metapage/js/lib/helpers/cursorUtils.js';
export class Manager extends MelObject {
  constructor() {
    super();
    this.post_uid = rcmail.env.post_uid; // Initialisation de `post_uid` depuis l'environnement
    this.post_id = rcmail.env.post_id; // Initialisation de `post_id` depuis l'environnement
    // this.show_comments = rcmail.env.show_comments; // Initialisation de `show_comments`
    this.sort_order = 'date_asc'; // Valeur par défaut ou à définir dynamiquement
    this.parent_comment_id = null; // Parent comment ID (optionnel)
  }

  /**
   * Initialise la logique de la page des commentaires, y compris le chargement des commentaires,
   * la gestion de l'ordre de tri, et l'interaction avec les éléments de l'interface utilisateur.
   *
   * Cette fonction effectue les opérations suivantes :
   * - Charge l'ordre de tri des commentaires depuis le LocalStorage ou utilise 'date_asc' par défaut.
   * - Assigne la valeur d'ordre de tri au select pour afficher la sélection correcte.
   * - Affiche les commentaires en fonction de l'ordre de tri récupéré.
   * - Gère le changement de tri des commentaires via un événement de sélection.
   * - Permet de rediriger l'utilisateur vers la page d'accueil au clic sur un bouton dédié.
   * - Configure le redimensionnement automatique du textarea pour les nouveaux commentaires.
   * - Affiche ou masque les boutons de commentaire selon l'état du textarea.
   *
   * @returns {void} - Cette fonction n'a pas de valeur de retour.
   */
  main() {
    super.main();

    // Gestion du bouton d'action du post
    this.initButtons();

    //affichage du bandeau si on est en brouillon
    if (this.get_env('is_draft')) {
      $('#footer-draft').removeClass('hidden');
    }

    rcmail.addEventListener('a.clicked', (args) => {
      if (!args.abort.signal && !args.url.includes('/?_task=')) {
        args.e.preventDefault();
        window.open(args.url, '_blank');
      }
    });

    // Charger l'ordre de tri depuis le LocalStorage, sinon utiliser 'date_desc' par défaut
    const savedSortOrder =
      localStorage.getItem('commentSortOrder') || 'date_asc';

    // Assigner la valeur sauvegardée au select pour afficher la sélection correcte
    $('#forum-comment-select').val(savedSortOrder);

    // Afficher les commentaires avec l'ordre de tri récupéré (ou par défaut si aucun tri sauvegardé)
    Manager.displayComments(savedSortOrder);

    // Associer l'événement de changement de tri au select
    $('#forum-comment-select').change(async (event) => {
      const selectedValue = $(event.target).val(); // Récupérer la valeur sélectionnée

      // Sauvegarder la sélection dans le LocalStorage
      localStorage.setItem('commentSortOrder', selectedValue);

      // Appeler displayComments avec l'ordre sélectionné
      await Manager.displayComments(selectedValue);
    });

    // Exporter 'manager'
    this.export('manager');

    // Redirection à la page d'accueil au clic sur 'return-homepage'
    $('#return-homepage').click(() => {
      CursorUtils.SetLoadingCursor();
      window.location.href = this.url('forum', {
        action: 'index',
        params: { _workspace_uid: this.get_env('workspace_uid') },
      });
    });
    $('#return-homepage').on('keydown', (event) => {
      if (event.keyCode === 13) {
        // Touche "Entrée"
        $('#return-homepage').click();
      }
    });

    // Fonction de redimensionnement automatique du textarea
    $(document).on('input', '.forum-comment-input', function () {
      this.style.height = 'auto'; // Réinitialise la hauteur
      this.style.height = this.scrollHeight + 'px'; // Ajuste la hauteur
    });

    // Configuration de la visibilité des boutons
    const $textarea = $('#new-comment-textarea');
    const $buttonsContainer = $('#buttons-container');
    const $cancelButton = $('#cancel-comment');

    // Initialement masqué
    $buttonsContainer.addClass('hidden');

    // Afficher les boutons lorsque le textarea reçoit le focus
    $textarea.on('focus', function () {
      $buttonsContainer.removeClass('hidden');
    });

    // Gestion du bouton "Annuler"
    $cancelButton.on('click', function () {
      $textarea.val(EMPTY_STRING); // Réinitialiser le contenu du textarea
      $textarea.height('auto'); // Revenir à la taille d'origine
      $buttonsContainer.addClass('hidden'); // Cacher les boutons "Annuler" et "Sauvegarder"
    });

    // Configuration du bouton "Sauvegarder"
    const $saveButton = $('#submit-comment');
    $saveButton.click(() => {
      const commentContent = $textarea.val();
      if (commentContent.trim() !== EMPTY_STRING) {
        // Appeler la fonction de sauvegarde
        this.saveComment(commentContent);
      }
    });
  }

  /**
   * Enregistre un nouveau commentaire et met à jour l'affichage.
   *
   * Cette fonction envoie le contenu du commentaire à l'API pour le créer,
   * puis réinitialise le champ de texte et affiche le nouveau commentaire en haut
   * de la liste en cas de succès. En cas d'erreur, un message d'erreur est affiché.
   *
   * @async
   * @function saveComment
   * @param {string} content - Le contenu du commentaire à enregistrer.
   * @returns {void}
   * @throws {Error} En cas d'échec de l'enregistrement ou d'une erreur réseau.
   */
  async saveComment(content) {
    // Changer le curseur en "wait"
    CursorUtils.SetLoadingCursor();

    // Désactiver le bouton de validation pour éviter les clics multiples
    const submitButton = $('#submit-comment');
    submitButton.prop('disabled', true);
    try {
      const id = rcmail.display_message('loading', 'loading');
      const response = await this.http_internal_post({
        task: 'forum',
        action: 'create_comment',
        params: {
          _post_uid: this.post_uid,
          _post_id: this.post_id,
          _content: content,
          _workspace_uid: this.get_env('workspace_uid'),
        },
      });

      rcmail.hide_message(id);
      if (response.status === 'success') {
        rcmail.display_message(response.message, 'confirmation');
        $('#new-comment-textarea').val(EMPTY_STRING); // Réinitialiser le textarea

        // Afficher le nouveau commentaire dans l'interface sans recharger la page
        await Manager.displaySingleComment(response.comment);
      } else {
        rcmail.display_message(response.message, 'error');
      }
    } catch (error) {
      rcmail.display_message(
        rcmail.gettext('mel_forum.comment_save_error'),
        'error',
      );
      console.error(rcmail.gettext('mel_forum.comment_save_failure'), error);
    } finally {
      // Réactiver le bouton de validation une fois la requête terminée et remettre le curseur par défaut
      submitButton.prop('disabled', false);
      CursorUtils.ResetCursor();
    }
  }

  /**
   * Affiche les commentaires associés à un post spécifique dans l'interface utilisateur.
   *
   * Cette méthode récupère tous les commentaires liés à un post en utilisant une instance de `PostCommentView`.
   * Les commentaires sont ensuite instanciés en tant qu'objets `PostComment`, leur contenu HTML est généré et ajouté
   * dynamiquement au DOM. Des événements de clic pour les boutons "like" et "dislike" sont également attachés après
   * l'affichage des commentaires.
   *
   * @async
   * @function
   * @name displayComments
   * @param {string} [order='date_desc'] - L'ordre dans lequel afficher les commentaires (par défaut 'date_desc').
   * @param {string|null} [parent_comment_id=null] - L'identifiant du commentaire parent pour filtrer les réponses (s'il y a lieu).
   * @returns {Promise<void>} Retourne une promesse qui est résolue une fois que tous les commentaires sont affichés et que les événements sont attachés.
   */
  static async displayComments(order = 'date_desc', parent_comment_id = null) {
    CursorUtils.SetLoadingCursor;

    BnumMessage.SetBusyLoading();

    let PostCommentManager = new PostCommentView(
      rcmail.env.post_uid,
      rcmail.env.post_id,
      order,
      parent_comment_id,
    );

    // Passer l'option de tri choisie à la fonction getCommentByPost
    let allComments;

    try {
      allComments = await PostCommentManager.getCommentByPost();
    } catch (error) {
      console.error(rcmail.gettext('mel_forum.comments_fetch_error'), error);
      // Vous pouvez afficher un message d'erreur à l'utilisateur ici si nécessaire
      return;
    }

    let comments_array = [];
    let responses_array = [];

    // Ajouter chaque commentaire à un tableau pour traitement
    for (const key in allComments) {
      if (allComments && allComments[key]) {
        const comment = allComments[key];

        let commentVizualizer = new PostComment(
          comment.id,
          comment.uid,
          comment.post_id,
          comment.user_email,
          comment.user_name,
          comment.content,
          comment.created,
          comment.likes,
          comment.dislikes,
          comment.parent,
          comment.children_number,
          comment.current_user_reacted,
        );

        // Si le commentaire est un commentaire principal (sans parent)
        if (!comment.parent) {
          comments_array.push(commentVizualizer);
        } else {
          responses_array.push(commentVizualizer);
        }
      }
    }

    //Si on affiche que les commentaires principaux
    if (!parent_comment_id) {
      // Vider la zone des commentaires avant de ré-afficher les commentaires récupérés
      $('#comment-area').empty();

      for (const comment of comments_array) {
        let commentHtml = comment.generateHtmlFromTemplate();

        // Ajouter le commentaire principal à la zone des commentaires
        $('#comment-area').append(...commentHtml);
      }
    } else if (responses_array.length) {
      for (const response of responses_array) {
        let responseHtml = response.generateHtmlFromTemplate();
        $(`#responses-${parent_comment_id}`).removeClass('hidden');
        $(`#responses-${parent_comment_id}`).append(...responseHtml);
      }
    }

    BnumMessage.StopBusyLoading();

    CursorUtils.ResetCursor();
  }

  /**
   * Affiche un commentaire dans la section appropriée de l'interface utilisateur.
   *
   * @param {Object} comment - L'objet commentaire à afficher.
   * @param {number} comment.id - L'identifiant unique du commentaire.
   * @param {string} comment.uid - L'identifiant unique de l'utilisateur ayant posté le commentaire.
   * @param {number} comment.post_id - L'identifiant du post auquel le commentaire appartient.
   * @param {number} comment.user_email - L'email de l'utilisateur ayant posté le commentaire.
   * @param {string} comment.user_name - Le nom de l'utilisateur ayant posté le commentaire.
   * @param {string} comment.content - Le contenu du commentaire.
   * @param {string} comment.created - La date de création du commentaire au format 'YYYY-MM-DD HH:mm:ss'.
   * @param {number} [comment.likes=0] - Le nombre de likes sur le commentaire (0 par défaut).
   * @param {number} [comment.dislikes=0] - Le nombre de dislikes sur le commentaire (0 par défaut).
   * @param {number} [comment.parent=null] - L'identifiant du commentaire parent si le commentaire est une réponse, sinon `null`.
   * @param {number} [comment.children_number=0] - Le nombre de réponses à ce commentaire (0 par défaut).
   * @param {boolean} [comment.current_user_reacted=false] - Indique si l'utilisateur actuel a réagi au commentaire (false par défaut).
   *
   * Crée une instance de `PostComment` pour le commentaire fourni, génère le HTML associé et l'ajoute à la section appropriée :
   * - Si le commentaire n'a pas de parent, il est ajouté directement à la zone de commentaires principale.
   * - Si le commentaire est une réponse, il est ajouté au conteneur des réponses du commentaire parent. Si ce conteneur n'existe pas encore, il est créé.
   *
   */
  static async displaySingleComment(comment) {
    // Formater la date et l'heure du commentaire avant de passer les données à PostComment
    const formattedDate = new Date(comment.created).toLocaleDateString(
      'fr-FR',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const formattedTime = new Date(comment.created).toLocaleTimeString(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    // Créer l'objet PostComment avec les données du commentaire
    let commentVizualizer = new PostComment(
      comment.id,
      comment.uid,
      comment.post_id,
      comment.user_email,
      comment.user_name,
      comment.content,
      `${formattedDate} à ${formattedTime}`,
      comment.likes,
      comment.dislikes,
      comment.parent,
      comment.children_number,
      comment.current_user_reacted,
    );

    // Générer le HTML pour le commentaire
    let commentHtml = $(commentVizualizer.generateHtmlFromTemplate());

    // Si le commentaire est un commentaire principal (sans parent)
    if (!comment.parent) {
      // Avant de prépendre, vérifie si le commentaire est déjà dans le DOM
      if (!$('#comment-area').find(`#comment-${comment.id}`).length) {
        // Ajouter le commentaire en haut de la liste des commentaires principaux
        $('#comment-area').prepend(commentHtml);
      }
    } else {
      // Si c'est une réponse à un commentaire parent
      let parent_comment_id = comment.parent;

      // Assurer que la zone des réponses est visible
      $(`#responses-${parent_comment_id}`).removeClass('hidden');

      // Avant de prépendre, vérifie si la réponse est déjà dans le DOM
      if (
        !$(`#responses-${parent_comment_id}`).find(`#comment-${comment.id}`)
          .length
      ) {
        // Ajouter la réponse en haut des réponses du commentaire parent
        $(`#responses-${parent_comment_id}`).prepend(commentHtml);
      }
    }
  }

  /**
   * Initialise les actions des boutons de la page
   */
  initButtons() {
    const more_action = $('#more-action');
    const context_menu = $('#post-context-menu');
    const button_copy = $('#copy-post');
    const button_download = $('#download-post');
    const button_history = $('#history-post');
    const button_edit = $('#edit-post');
    const button_delete = $('#delete-post');
    const button_add_like = $('#add_like');
    const button_add_dislike = $('#add_dislike');
    const button_edit_footer = $('#footer-edit-post');

    //Ne pas afficher les boutons d'édition, supression et historique si l'utilisateur n'a pas les droits suffisant
    if (!rcmail.env.has_owner_rights) {
      button_delete.toggleClass('hidden');
      button_edit.toggleClass('hidden');
      button_edit_footer.toggleClass('hidden');
      button_history.toggleClass('hidden');
    }

    more_action.click(() => {
      context_menu.toggleClass('hidden');
      // Si le menu est visible, ajouter un écouteur pour détecter les clics extérieurs
      if (!context_menu.hasClass('hidden')) {
        // Ajouter un écouteur de clic sur tout le document après un léger délai
        setTimeout(() => {
          $(document).on('click.menuOutside', function (event) {
            // Vérifier si le clic est en dehors du menu et du bouton trigger
            if (
              !$(event.target).closest(context_menu).length &&
              !$(event.target).closest(more_action).length
            ) {
              context_menu.addClass('hidden'); // Masquer le menu
              $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
            }
          });

          // Ajouter un écouteur d'événements pour chaque bouton du menu
          context_menu.find('.post-options-button').on('click', function () {
            context_menu.addClass('hidden'); // Fermer le menu
            $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
          });
        }, 0); // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier
      } else {
        // Si le menu est caché, retirer l'écouteur du document
        $(document).off('click.menuOutside');
      }
    });
    //Gestion du clavier
    more_action.on('keydown', (event) => {
      if (event.keyCode === 13) {
        more_action.click();
      }
    });

    button_copy.click(() => {
      this.copyPostLink();
    });
    button_edit.click(() => {
      this.editPost();
    });
    button_delete.click(() => {
      this.deletePost();
    });
    button_download.click(() => {
      this.downloadPost();
    });
    button_history.click(() => {
      this.historyPost();
    });
    button_edit_footer.click(() => {
      this.editPost();
    });

    // Initialisation de l'affichage boutons like et dislike en fonction de l'utilisateur.
    if (rcmail.env.has_liked) {
      button_add_like.addClass('filled');
    }
    button_add_like.attr(
      'title',
      rcmail.env.like_reactions.join(', ') +
        (rcmail.env.like_count > 1
          ? this.gettext('mel_forum.liked_this_plural')
          : rcmail.env.like_count === 1
            ? this.gettext('mel_forum.liked_this_sing')
            : this.gettext('mel_forum.like_action')),
    );

    if (rcmail.env.has_disliked) {
      button_add_dislike.addClass('filled');
    }
    button_add_dislike.attr(
      'title',
      rcmail.env.dislike_reactions.join(', ') +
        (rcmail.env.dislike_count > 1
          ? this.gettext('mel_forum.disliked_this_plural')
          : rcmail.env.dislike_count === 1
            ? this.gettext('mel_forum.disliked_this_sing')
            : this.gettext('mel_forum.dislike_action')),
    );

    //listenner des boutons likes est dislike
    button_add_like.on('keydown', (event) => {
      if (event.keyCode === 13) {
        // Touche "Entrée"
        this.addLikeOrDislike('like');
      }
    });
    button_add_like.click(() => {
      this.addLikeOrDislike('like');
    });

    button_add_dislike.on('keydown', (event) => {
      if (event.keyCode === 13) {
        // Touche "Entrée"
        this.addLikeOrDislike('dislike');
      }
    });
    button_add_dislike.click(() => {
      this.addLikeOrDislike('dislike');
    });

    //gestion du scroll sur la page
    document.querySelector('.content').addEventListener('scroll', () => {
      const scrollPos = document.querySelector('.content').scrollTop;
      if (scrollPos === 0) {
        $('#backToTop').addClass('hidden');
      } else {
        $('#backToTop').removeClass('hidden');
      }
    });

    //action backToTop
    $('#backToTop').click(() => {
      document.querySelector('.content').scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  /**
   * copie dans le presse papier l'url de la page
   */
  copyPostLink() {
    let url = window.location.href.replaceAll(
      '&_is_from=iframe',
      '&_force_bnum=1',
    );
    navigator.clipboard.writeText(url).then(() => {
      BnumMessage.DisplayMessage(
        rcmail.gettext('mel_forum.link_copied'),
        eMessageType.Confirmation,
      );
    });
  }

  /**
   * Permet d'éditer un post.
   *
   * - Construit l'URL d'édition en utilisant l'uid du post et du workspace.
   * @returns {void}
   */
  editPost() {
    CursorUtils.SetLoadingCursor();

    // Rediriger vers la page d'édition avec l'UID du post
    window.location.href = this.url('forum', {
      action: 'create_or_edit_post',
      params: {
        _uid: rcmail.env.post_uid,
        _workspace_uid: rcmail.env.workspace_uid,
      },
    });
  }

  /**
   * Supprime un post spécifique après confirmation de l'utilisateur.
   *
   * - Empêche les comportements par défaut et la propagation de l'événement.
   * - Affiche une boîte de dialogue de confirmation avant de procéder.
   * - Envoie une requête HTTP pour supprimer le post.
   * - Gère les retours de succès ou d'erreur et met à jour l'affichage en conséquence.
   * @returns {void}
   */
  deletePost() {
    // Demander confirmation à l'utilisateur avant de supprimer
    const confirmation = confirm(
      rcmail.gettext('mel_forum.delete_post_confirm'),
    );
    if (!confirmation) return; // Arrêter la fonction si l'utilisateur annule

    CursorUtils.SetLoadingCursor();

    // Envoi d'une requête HTTP pour supprimer le post
    this.http_internal_post({
      task: 'forum',
      action: 'delete_post',
      params: {
        _uid: rcmail.env.post_uid,
        _workspace_uid: rcmail.env.workspace_uid,
      },
      processData: false,
      contentType: false,
      on_success: (response) => {
        const parsedResponse = JSON.parse(response);

        if (parsedResponse.status === 'success') {
          // Affichage du message de succès
          BnumMessage.DisplayMessage(
            parsedResponse.message ||
              rcmail.gettext('mel_forum.delete_post_success'),
            eMessageType.Confirmation,
          );

          //retourner à la page d'accueil
          window.location.href = this.url('forum', {
            action: 'index',
            params: { _workspace_uid: this.get_env('workspace_uid') },
          });
        } else {
          // Affichage du message d'erreur en cas d'échec
          BnumMessage.DisplayMessage(
            parsedResponse.message ||
              rcmail.gettext('mel_forum.delete_post_failure'),
            eMessageType.Error,
          );
        }
      },
      on_error: () => {
        // Affichage du message d'erreur en cas de problème avec la requête
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.delete_post_failure'),
          eMessageType.Error,
        );

        CursorUtils.ResetCursor();
      },
    });
  }

  /**
   * Redirige vers la page d'historique de l'article.
   */
  historyPost() {
    CursorUtils.SetLoadingCursor();

    // Rediriger vers la page de l'historique avec l'UID du post
    window.location.href = this.url('forum', {
      action: 'history',
      params: {
        _uid: rcmail.env.post_uid,
        _workspace_uid: rcmail.env.workspace_uid,
      },
    });
  }

  /**
   * Affiche une modale pour choisir le format de téléchargement d'un article et lance le téléchargement dans le format sélectionné.
   *
   * Cette fonction vérifie la validité de l'UID de l'article avant d'afficher une modale permettant à l'utilisateur
   * de choisir entre les formats Markdown et HTML. Une fois le format choisi, le téléchargement est lancé via une URL
   * construite dynamiquement.
   *
   * @return void Cette fonction n'a pas de valeur de retour.
   */
  downloadPost() {
    const uid = rcmail.env.post_uid; // Récupération de l'UID du post depuis l'environnement

    // Vérifier si l'UID est valide avant de continuer
    if (!uid) {
      console.error('UID du post non fourni !');
      BnumMessage.DisplayMessage(
        rcmail.gettext('mel_forum.download_post_failure'),
        eMessageType.Error,
      );
      return;
    }

    //prettier-ignore
    const modalContent = MelHtml.start
        .div()
          .text(rcmail.gettext('mel_forum.choose_download_format'))
          .div({ class: 'radio-group' })  // Appliquer la classe 'radio-group'
            .label()
              .input({ id: 'dl-markdown', type: 'radio', name: 'download-format', value: 'Markdown', checked: true })
              .text('Markdown')
            .end()
            .label()
              .input({ id: 'dl-html', type: 'radio', name: 'download-format', value: 'Html' })
              .text('HTML')
            .end()
          .end();

    // Configuration de la modale
    let dialog = new MelDialog(
      new DialogPage('choose-download-format', {
        content: modalContent,
        // eslint-disable-next-line quotes
        title: "Télécharger l'article",
        buttons: [
          new RcmailDialogButton('Annuler', {
            click: () => {
              dialog.hide();
            },
            classes: 'mel-button btn btn-secondary',
          }),
          new RcmailDialogButton('Télécharger', {
            click: () => {
              // Récupérer le format choisi
              const selectedFormat = $(
                'input[name="download-format"]:checked',
              ).val();

              // Construction de l'URL en utilisant this.url()
              let downloadUrl = this.url('forum', {
                action: 'download_article',
                params: {
                  _uid: uid,
                  _format: selectedFormat,
                },
                removeIsFromIframe: true,
              });

              // Ouvrir l'URL dans un nouvel onglet
              window.open(downloadUrl, '_blank');

              // Optionnel : Afficher un message de confirmation après ouverture du lien
              BnumMessage.DisplayMessage(
                rcmail.gettext('mel_forum.download_post_success'),
                eMessageType.Confirmation,
              );

              // Cacher la modale après l'action
              dialog.hide();
            },
          }),
        ],
      }),
      {
        height: 175,
        width: 300,
        close: () => {},
      },
    );

    // Afficher la modale
    dialog.show();
  }
  /**
   * Met à jour le compteur de like
   * @param {external:jQuery} span élément html à mettre à jour
   * @param {number} value modification apportée au compteur
   */
  updateCounter(span, value) {
    let currentValue = +(span.text() || 0); // Récupérer la valeur actuelle
    let newValue = currentValue + value;
    span.text(newValue);
  }

  /**
   * Met à jour le title de la reaction
   * @param {external:jQuery} div élément html à mettre à jour
   * @param {external:jQuery} counter div du compteur de reaction
   * @param {'like' | 'dislike'} type type de la reaction (like ou dislike)
   * @param {boolean} add booleen true si on ajoute une reaction false si on l'enlève
   */
  updateTitle(div, counter, type, add) {
    let currentValue = +(counter.text() || 0);
    let newstring = div.attr('title');
    let dis = type === 'like' ? '' : 'dis';
    switch (currentValue) {
      case 0:
        newstring = this.gettext('mel_forum.' + dis + 'like_action');
        break;
      case 1:
        if (add) {
          newstring =
            this.get_env('user_fullname') +
            this.gettext('mel_forum.' + dis + 'liked_this_sing');
        } else {
          newstring = newstring
            .replace(this.get_env('user_fullname'), '')
            .replace(', ', '')
            .replace(
              this.gettext('mel_forum.' + dis + 'liked_this_plural'),
              this.gettext('mel_forum.' + dis + 'liked_this_sing'),
            );
        }
        break;
      default:
        if (add) {
          newstring =
            this.get_env('user_fullname') +
            ', ' +
            newstring.replace(
              this.gettext('mel_forum.' + dis + 'liked_this_sing'),
              this.gettext('mel_forum.' + dis + 'liked_this_plural'),
            );
        } else {
          newstring = newstring.replace(this.get_env('user_fullname'), '');
        }
        break;
    }
    div.attr('title', newstring);
  }

  /**
   * Gestion des likes et dislike des posts
   * @param {*} type type de la reaction
   */
  addLikeOrDislike(type) {
    this.http_internal_post({
      task: 'forum',
      action: 'manage_reaction',
      params: {
        _post_id: rcmail.env.post_id,
        _type: type,
        _workspace_uid: rcmail.env.workspace_uid,
      },
      processData: false,
      contentType: false,
      on_success: () => {
        let like_div = $('#add_like');
        let dislike_div = $('#add_dislike');
        let like_counter = like_div.find('span.ml-2');
        let dislike_counter = dislike_div.find('span.ml-2');

        let opposite_type = type === 'like' ? 'dislike' : 'like';
        let target_div = type === 'like' ? like_div : dislike_div;
        let target_counter = type === 'like' ? like_counter : dislike_counter;
        let opposite_div = type === 'like' ? dislike_div : like_div;
        let opposite_counter = type === 'like' ? dislike_counter : like_counter;

        if (target_div.hasClass('filled')) {
          target_div.removeClass('filled');
          this.updateCounter(target_counter, -1);
          // true signifie qu'on ajoute la réaction
          this.updateTitle(target_div, target_counter, type, false);
        } else {
          target_div.addClass('filled');
          this.updateCounter(target_counter, 1);
          // true signifie qu'on ajoute la réaction
          this.updateTitle(target_div, target_counter, type, true);

          if (opposite_div.hasClass('filled')) {
            opposite_div.removeClass('filled');
            this.updateCounter(opposite_counter, -1);
            // false signifie qu'on enlève la réaction
            this.updateTitle(
              opposite_div,
              opposite_counter,
              opposite_type,
              false,
            );
          }
        }
      },
      on_error: () => {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.error_editing'),
          eMessageType.Error,
        );
      },
    });
  }
}
