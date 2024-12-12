import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';

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

      // Vérifier si la valeur sélectionnée est correctement récupérée
      console.log('Option sélectionnée:', selectedValue);

      // Sauvegarder la sélection dans le LocalStorage
      localStorage.setItem('commentSortOrder', selectedValue);

      // Appeler displayComments avec l'ordre sélectionné
      await Manager.displayComments(selectedValue);
    });

    // Exporter 'manager'
    this.export('manager');

    // Redirection à la page d'accueil au clic sur 'return-homepage'
    $('#return-homepage').click(() => {
      window.location.href = this.url('forum', {
        action: 'index',
        params: { _workspace_uid: this.get_env('workspace_uid') },
      });
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
    // Désactiver le bouton de validation pour éviter les clics multiples
    const submitButton = $('#submit-comment');
    submitButton.prop('disabled', true);
    try {
      const id = rcmail.display_message('loading', 'loading');
      const response = await this.http_internal_post({
        task: 'forum',
        action: 'create_comment',
        params: {
          _post_id: this.post_id,
          _content: content,
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
      // Réactiver le bouton de validation une fois la requête terminée
      submitButton.prop('disabled', false);
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
}
