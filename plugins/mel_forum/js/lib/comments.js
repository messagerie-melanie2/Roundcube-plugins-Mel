import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';


export {PostComment, PostCommentView}

class PostComment {
  constructor(id, uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number, current_user_reacted) {
    this._init()._setup(id, uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number, current_user_reacted)
  }

  /**
 * Initialise un objet avec des valeurs par défaut.
 *
 * Cette fonction réinitialise toutes les propriétés de l'objet, telles que
 * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, `parent` et `children_number` à des chaînes de caractères vides.
 * Elle retourne l'objet lui-même après l'initialisation.
 *
 * @return {Object} L'objet initialisé avec des valeurs par défaut.
 */
  _init() {
    this.id = '';
    this.uid = '';
    this.post_id = '';
    this.user_uid = '';
    this.user_name = '';
    this.content = '';
    this.created = '';
    this.likes = 0;
    this.dislikes = 0;
    this.parent = '';
    this.children_number = 0;
    this.current_user_reacted = '';

    return this;
  }

  /**
 * Configure les propriétés de l'objet avec les valeurs spécifiées.
 *
 * Cette fonction utilise `Object.defineProperties` pour définir les propriétés
 * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, `parent` et `children_number` de l'objet. Chaque propriété a un getter qui 
 * retourne la valeur initiale passée en paramètre, et un setter qui permet 
 * de mettre à jour cette valeur.
 *
 * @param {string} id - L'identifiant de l'objet.
 * @param {string} uid - L'identifiant unique de l'objet.
 * @param {string} post_id - L'identifiant du post associé.
 * @param {string} user_uid - L'identifiant de l'utilisateur.
 * @param {string} user_name - Le nom de l'utilisateur.
 * @param {string} content - Le contenu du commentaire ou du post.
 * @param {string} created - La date de création.
 * @param {string} likes - Le nombre de likes.
 * @param {string} dislikes - Le nombre de dislikes.
 * @param {string} parent - L'Id du commentaire parent s'il existe'.
 * @param {integer} children_number - Le nombre de réponse au commentaire parent
 * @param {string} current_user_reacted - reaction de l'utilisateur courant au commentaire
 */
  _setup(id, uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number, current_user_reacted) {

          this.id = id;
          this.uid = uid;
          this.post_id = post_id;
          this.user_uid = user_uid;
          this.user_name = user_name;
          this.content = content;
          this.created = created;
          this.likes = likes;
          this.dislikes = dislikes;
          this.parent = parent;
          this.children_number = children_number;
          this.current_user_reacted = current_user_reacted;
  }
  
  /**
 * Enregistre ou met à jour une réaction (like ou dislike) sur un commentaire.
 *
 * Cette fonction envoie une requête au serveur pour enregistrer ou modifier une réaction 
 * de l'utilisateur sur un commentaire. Si la réaction est annulée, une nouvelle requête 
 * est envoyée pour enregistrer la nouvelle réaction. L'interface utilisateur est mise à jour 
 * en conséquence pour refléter le changement de réaction.
 *
 * @param {string} type - Le type de réaction ('like' ou 'dislike').
 * @param {string} uid - L'identifiant unique du commentaire.
 * @returns {Object} response - La réponse du serveur, incluant le statut et le message.
 */
  async saveLikeOrDislike(type, uid) {
    try {
        const sendRequest = async (reactionType) => {
            return await mel_metapage.Functions.post(
                mel_metapage.Functions.url('forum', 'like_comment'),
                { 
                    _comment_id: this.id,
                    _comment_uid: this.uid,
                    _type: reactionType
                }
            );
        };

        let response = await sendRequest(type);

        let likeCounterElement = $('[data-like-uid="'+uid+'"]').siblings('span.ml-2');
        let dislikeCounterElement = $('[data-dislike-uid="'+uid+'"]').siblings('span.ml-2');
        let likeActionElement = $('[data-like-uid="'+uid+'"]');
        let dislikeActionElement = $('[data-dislike-uid="'+uid+'"]');

        if (response.message.includes('annulé')) {
            if (type === 'like') {
                likeCounterElement.text(Math.max(0, parseInt(likeCounterElement.text()) - 1));
                likeActionElement.parent().removeClass('active');
                this.current_user_reacted = ''; 
            } else if (type === 'dislike') {
                dislikeCounterElement.text(Math.max(0, parseInt(dislikeCounterElement.text()) - 1));
                dislikeActionElement.parent().removeClass('active');
                this.current_user_reacted = '';
            }
        } else {
            if (type === 'like') {
                likeCounterElement.text(parseInt(likeCounterElement.text()) + 1);
                likeActionElement.parent().addClass('active');
                this.current_user_reacted = 'like';
                if (dislikeActionElement.parent().hasClass('active')) {
                    dislikeCounterElement.text(Math.max(0, parseInt(dislikeCounterElement.text()) - 1));
                    dislikeActionElement.parent().removeClass('active');
                }
            } else if (type === 'dislike') {
                dislikeCounterElement.text(parseInt(dislikeCounterElement.text()) + 1);
                dislikeActionElement.parent().addClass('active');
                this.current_user_reacted = 'dislike';
                if (likeActionElement.parent().hasClass('active')) {
                    likeCounterElement.text(Math.max(0, parseInt(likeCounterElement.text()) - 1));
                    likeActionElement.parent().removeClass('active');
                }
            }
        }

        if (response.status === 'success') {
            rcmail.display_message(response.message, 'confirmation');
        } else {
            rcmail.display_message(response.message, 'error');
        }

        return response;
    } catch (error) {
        rcmail.display_message('Une erreur est survenue lors de l\'enregistrement de votre réaction.', 'error');
        console.error("Erreur lors de l'enregistrement du like/dislike:", error);
    }
}

/**
 * Bascule l'affichage des réponses d'un commentaire et met à jour l'icône de basculement.
 *
 * Cette fonction affiche ou masque les réponses d'un commentaire en fonction de leur état actuel,
 * en ajoutant ou supprimant la classe CSS 'hidden'. L'icône de basculement est également mise à jour
 * pour indiquer visuellement l'état (affiché ou masqué) des réponses.
 *
 * @param {string} id - L'identifiant unique du commentaire pour lequel les réponses doivent être basculées.
 * @returns {Promise<void>} Une promesse résolue une fois l'opération terminée.
 */
async toggleResponses(id) {
  try {
      // Correction du sélecteur jQuery
      let responseContainer = $('#responses-' + id);
      // Sélection de l'icône correspondante
      let toggleIcon = $('#toggle-icon-' + id);

      // Basculer la classe 'hidden' pour afficher ou masquer les réponses
      responseContainer.toggleClass('hidden');
      
      // Basculer entre les icônes 'arrow_drop_down' et 'arrow_drop_up'
      if (responseContainer.hasClass('hidden')) {
        toggleIcon.attr('data-icon', 'arrow_drop_down');
    } else {
        toggleIcon.attr('data-icon', 'arrow_drop_up');
    }
} catch (error) {
    console.error("Erreur lors du basculement des réponses:", error);
}
}

/**
 * Bascule l'affichage du formulaire de réponse et gère l'état des autres formulaires de réponse.
 *
 * @param {string|number} uid - L'identifiant unique utilisé pour cibler le formulaire de réponse à afficher/masquer.
 * @param {string|number} [parentId] - L'identifiant du commentaire parent auquel la réponse sera associée. 
 *                                      Si non fourni, utilise l'ID du commentaire actuel.
 *
 * Cette fonction effectue les opérations suivantes :
 * - Masque tous les autres formulaires de réponse (en ajoutant la classe 'hidden').
 * - Affiche ou masque le formulaire de réponse spécifié.
 * - Stocke l'ID du parent pour l'utiliser lors de l'envoi de la réponse.
 * - Réinitialise le contenu et les dimensions du textarea lorsque le formulaire devient visible.
 * - Met le focus sur le textarea lorsque le formulaire est affiché.
 */

async toggleReplyForm(uid, parentId) {
  let form = $('#reply-form-' + uid);
  let isVisible = !form.hasClass('hidden');
  
  // Masquer tous les autres formulaires de réponse
  $('#reply-form').not(form).addClass('hidden');
  
  // Afficher ou masquer le formulaire actuel
  form.toggleClass('hidden');

  // Stocker l'ID du parent pour l'utiliser lors de l'envoi de la réponse
  this.parent = parentId || this.id;  // Enregistre l'ID du commentaire parent dans `this.parent`
  
  // Réinitialiser le textarea lorsque le formulaire est visible
  if (!isVisible) {
      form.find('textarea').val('').height('auto');
      form.find('.btn').show(); // Assurez-vous que les boutons sont visibles
  }
  
  // Focus sur le textarea lorsque le formulaire est visible
  if (!form.hasClass('hidden')) {
      form.find('textarea').focus();
  }
}

/**
 * Enregistre une réponse à un commentaire et met à jour l'interface utilisateur en conséquence.
 *
 * @async
 * @returns {Promise<void>} - Une promesse qui se résout lorsque la réponse est enregistrée et l'interface mise à jour.
 *
 * Cette fonction récupère le contenu de la réponse à partir d'une zone de texte spécifique, vérifie que le contenu n'est pas vide,
 * puis envoie une requête pour enregistrer la réponse. Si l'enregistrement est réussi :
 * - Affiche un message de confirmation.
 * - Vide la zone de texte.
 * - Cache le formulaire de réponse.
 * - Affiche le nouveau commentaire dans l'interface utilisateur.
 * 
 * En cas d'échec ou d'erreur lors de l'enregistrement :
 * - Affiche un message d'erreur.
 * - Enregistre l'erreur dans la console.
 * 
 * @throws {Error} Si une erreur survient lors de l'envoi de la requête ou de l'enregistrement de la réponse.
 */
async saveReply() {
  const $textarea = $('#new-response-textarea-' + this.uid);
  const replyContent = $textarea.val(); // Récupérer le contenu du commentaire
  if (replyContent && replyContent.trim() !== '') {     // Vérifier si le commentaire n'est pas vide
      try {
          const response = await mel_metapage.Functions.post(
              mel_metapage.Functions.url('forum', 'create_comment'),
              {
                  _post_id: this.post_id,  // L'ID du post
                  _content: replyContent, // Le contenu de la réponse
                  _parent: this.parent,     // ID du commentaire parent
              }
          );
          if (response.status === 'success') {
              rcmail.display_message(response.message, 'confirmation');

              // Vider le textarea
              $textarea.val('');

              // Fermer le formulaire en ajoutant la classe 'hidden'
              $('#reply-form-' + this.uid).addClass('hidden');

              // Insérer le nouveau commentaire
              this.displaySingleComment(response.comment);  
          } else {
              rcmail.display_message(response.message, 'error');
          }
      } catch (error) {
          rcmail.display_message("Une erreur est survenue lors de la sauvegarde de la réponse.", 'error');
          console.error("Erreur lors de la sauvegarde de la réponse:", error);
      }
  } else {
      rcmail.display_message("Le contenu du commentaire ne peut pas être vide.", 'error');
  }
}

/**
 * Affiche un commentaire dans la section appropriée de l'interface utilisateur.
 *
 * @param {Object} comment - L'objet commentaire à afficher.
 * @param {number} comment.id - L'identifiant unique du commentaire.
 * @param {string} comment.uid - L'identifiant unique de l'utilisateur ayant posté le commentaire.
 * @param {number} comment.post_id - L'identifiant du post auquel le commentaire appartient.
 * @param {number} comment.user_id - L'identifiant de l'utilisateur ayant posté le commentaire.
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
async displaySingleComment(comment) {

  // Définir le format de la date d'entrée
  let inputFormat = 'YYYY-MM-DD HH:mm:ss';
  
  // Créer un objet moment en utilisant le format spécifié
  let formattedDate = moment(this.created, inputFormat).format('D MMMM YYYY'); // Format souhaité

  let commentVizualizer = new PostComment(
    comment.id,
    comment.uid,
    comment.post_id,
    comment.user_id,
    comment.user_name,
    comment.content,
    formattedDate,
    comment.likes || 0,
    comment.dislikes || 0,
    comment.parent,
    comment.children_number,
    comment.current_user_reacted,
  );

  let commentHtml = commentVizualizer.generateHtml();

  if (!comment.parent) {
    commentHtml.appendTo($('#comment-area'));
  } else {
    let parentResponseContainer = $('#responses-' + comment.parent);
    
    if (parentResponseContainer.length === 0) {
      parentResponseContainer = $('<div id="responses-' + comment.parent + '"></div>');
      $('#comment-' + comment.parent).append(parentResponseContainer);
    }
    
    commentHtml.appendTo(parentResponseContainer);
  }
}

/**
 * Bascule l'affichage d'un conteneur de sélection et applique des actions spécifiques lorsque le conteneur devient visible.
 * @param {string|number} uid - L'identifiant unique utilisé pour cibler le conteneur de sélection associé.
 *
 * Le conteneur ciblé est supposé avoir un identifiant au format `#select-container-{uid}`.
 * 
 * - Si le conteneur est trouvé, la classe 'hidden' est ajoutée ou retirée pour basculer son affichage.
 * - Si le conteneur devient visible, le premier élément `<select>` qu'il contient reçoit le focus et une taille est forcée 
 *   pour afficher toutes les options dans certains navigateurs.
 * - Si le conteneur n'est pas trouvé, un message d'erreur est affiché dans la console.
 */
toggleMenu(uid) {
  let selectContainer = $('#context-menu-' + uid);
  let triggerButton = $('#trigger-' + uid);  // Bouton more_horiz

  // Vérifier si le conteneur du menu existe
  if (selectContainer.length) {
    // Basculer l'affichage du conteneur
    selectContainer.toggleClass('hidden');

    // Si le menu est visible, ajouter un écouteur pour détecter les clics extérieurs
    if (!selectContainer.hasClass('hidden')) {
      // Ajouter un écouteur de clic sur tout le document après un léger délai
      setTimeout(() => {
        $(document).on('click.menuOutside', function(event) {
          // Vérifier si le clic est en dehors du menu et du bouton trigger
          if (!$(event.target).closest(selectContainer).length && !$(event.target).closest(triggerButton).length) {
            selectContainer.addClass('hidden');  // Masquer le menu
            $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
          }
        });

        // Ajouter un écouteur d'événements pour chaque bouton du menu
        selectContainer.find('.comment-options-button').on('click', function() {
          selectContainer.addClass('hidden'); // Fermer le menu
          $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
        });
      }, 0);  // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier

      // Empêcher la propagation du clic sur le bouton trigger pour éviter la fermeture immédiate
      triggerButton.off('click').on('click', function(event) {
        event.stopPropagation(); // Empêche la propagation du clic vers l'écouteur du document
      });

    } else {
      // Si le menu est caché, retirer l'écouteur du document
      $(document).off('click.menuOutside');
    }
  }
}


/**
 * Basculer l'affichage entre le texte du commentaire et le champ de texte de modification.
 *
 * Cette fonction permet d'afficher ou de masquer la section de modification du commentaire 
 * en fonction de l'état actuel de l'affichage.
 *
 * @function toggleModifyComment
 * @param {string} uid - L'identifiant unique du commentaire à modifier.
 * @returns {void}
 */
toggleModifyComment(uid) {
  let commentTextDiv = $('#comment-text-' + uid);
  let editTextDiv = $('#edit-comment-' + uid);

  // Basculer entre le content et le textarea de modification
  commentTextDiv.toggleClass('hidden');
  editTextDiv.toggleClass('hidden')
}

/**
 * Annule la modification du commentaire en rétablissant l'affichage initial.
 *
 * Cette fonction appelle `toggleModifyComment` pour basculer l'affichage 
 * entre la section de texte et la section de modification.
 *
 * @function cancelModifyComment
 * @param {string} uid - L'identifiant unique du commentaire dont la modification est annulée.
 * @returns {void}
 */
cancelModifyComment(uid) {
  this.toggleModifyComment(uid);
}

/**
 * Enregistre les modifications d'un commentaire et met à jour l'interface utilisateur en conséquence.
 *
 * @async
 * @returns {Promise<void>} - Une promesse qui se résout lorsque la modification est enregistrée et l'interface mise à jour.
 *
 * Cette fonction récupère le contenu modifié du commentaire à partir d'une zone de texte spécifique, vérifie que le contenu n'est pas vide,
 * puis envoie une requête pour enregistrer la modification. Si l'enregistrement est réussi :
 * - Affiche un message de confirmation.
 * - Cache le formulaire de modification.
 * - Met à jour le texte du commentaire dans l'interface utilisateur.
 * 
 * En cas d'échec ou d'erreur lors de l'enregistrement :
 * - Affiche un message d'erreur.
 * - Enregistre l'erreur dans la console.
 */
async modifyComment(uid) {
  const $textarea = $('#edit-comment-textarea-' + uid);
  const updatedContent = $textarea.val(); // Récupère le nouveau contenu du commentaire
  if (updatedContent && updatedContent.trim() !== '') {
    try {
      const response = await mel_metapage.Functions.post(
        mel_metapage.Functions.url('forum', 'update_comment'),
        {
          _uid: uid, // L'ID du commentaire
          _content: updatedContent // Le nouveau contenu
        }
      );

      if (response.status === 'success') {
        rcmail.display_message(response.message, 'confirmation');

        // Mettre à jour l'affichage du commentaire avec le nouveau contenu
        $('#comment-text-' + uid).text(updatedContent);

        // Fermer le formulaire de modification en ajoutant la classe 'hidden'
        $('#edit-comment-' + uid).addClass('hidden');

        // Rafraîchir les commentaires après les modifications
        this.displayComments();

      } else {
        rcmail.display_message(response.message, 'error');
      }
    } catch (error) {
      rcmail.display_message("Une erreur est survenue lors de la mise à jour du commentaire.", 'error');
      console.error("Erreur lors de la mise à jour du commentaire:", error);
    }
  } else {
    rcmail.display_message("Le contenu du commentaire ne peut pas être vide.", 'error');
  }
}

/**
 * Supprime un commentaire spécifique après confirmation de l'utilisateur.
 *
 * Cette fonction envoie une requête à l'API de suppression du commentaire, 
 * puis met à jour l'affichage en retirant le commentaire supprimé.
 *
 * @async
 * @function deleteComment
 * @param {string} uid - L'identifiant unique du commentaire à supprimer.
 * @returns {void}
 * @throws {Error} En cas d'échec de la suppression ou d'une erreur réseau.
 */
async deleteComment(uid) {
  // Demander confirmation à l'utilisateur avant de supprimer
  const confirmation = confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?');
  
  if (!confirmation) return;

  try {
    const response = await mel_metapage.Functions.post(
      mel_metapage.Functions.url('forum', 'delete_comment'), // API de suppression
      {
        _uid: uid // L'ID du commentaire à supprimer
      }
    );

    if (response.status === 'success') {
      rcmail.display_message(response.message, 'confirmation');

      // Supprimer le commentaire de l'affichage
      $('#comment-id-' + uid).remove();

      // Rafraîchir les commentaires si nécessaire
      this.displayComments();

    } else {
      rcmail.display_message(response.message, 'error');
    }
  } catch (error) {
    rcmail.display_message("Une erreur est survenue lors de la suppression du commentaire.", 'error');
    console.error("Erreur lors de la suppression du commentaire:", error);
  }
}




/**
 * Génère le code HTML pour afficher un commentaire avec ses réactions et options associées.
 *
 * Cette fonction construit dynamiquement le HTML d'un commentaire, en incluant les informations
 * sur l'auteur, le contenu, la date de création, ainsi que les boutons de réaction (like, dislike, répondre).
 * Le HTML est adapté en fonction des données du commentaire, comme le nombre de likes, dislikes, et réponses.
 *
 * - Les classes CSS sont déterminées pour indiquer si l'utilisateur a déjà réagi (like/dislike).
 * - Le texte des réponses est ajusté pour être au singulier ou au pluriel en fonction du nombre de réponses.
 * - Si le commentaire a des réponses, un élément pour afficher ou masquer les réponses est ajouté.
 *
 * @returns {Object} Un objet HTML généré, prêt à être inséré dans le DOM.
 */
generateHtmlFromTemplate() {
  let likeClass = this.current_user_reacted === 'like' ? 'reaction-item active mr-3' : 'reaction-item mr-3';
  let dislikeClass = this.current_user_reacted === 'dislike' ? 'reaction-item active mr-3' : 'reaction-item mr-3';

  // Détermination du pluriel ou du singulier pour "réponse(s)"
  let reponseText = this.children_number > 1 ? 'réponses' : 'réponse';

  // Générer les initiales de l'utilisateur pour l'image de profil
  let getInitials = function(fullName) {
    const names = fullName.split(' ');
    if (names.length === 0) return '?'; // Aucun nom donné
    const firstInitial = names[0][0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : ''; // Garde seulement la dernière partie
    return (firstInitial + lastInitial).toUpperCase();    
  };

  // Générer une couleur de fond aléatoire pour l'image de profil
  let getRandomColor = function() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
  };

  // Préparez les données à insérer dans le template
  const data = {
    UID: this.uid,
    PROFILE_COLOR: getRandomColor(),
    USER_INITIALS: getInitials(this.user_name),
    USER_NAME: this.user_name,
    COMMENT_DATE: this.created,
    COMMENT_CONTENT: this.content,
    COMMENT_ID: this.id,
    LIKE_CLASS: likeClass,
    DISLIKE_CLASS: dislikeClass,
    LIKES: this.likes.toString(),
    DISLIKES: this.dislikes.toString(),
    RESPONSE_SECTION: this.children_number > 0 ? 
    MelHtml.start
      .div({ class: 'forum-comment-response', 'data-comment-id': this.id })
        .span({ id: 'toggle-icon-' + this.id, class: 'icon', 'data-icon': 'arrow_drop_down' }).end('span')
        .span({ class: 'ml-2' }).text(this.children_number + ' ' + reponseText).end('span')
      .end('div')
      .div({ id: 'responses-' + this.id, class: 'responses ml-4 hidden' })
      .end('div')
    .generate_html(true) : ''
  };

  // Utilisation de MelTemplate
  let template = new MelTemplate()
    .setTemplateSelector('#comment-template')
    .setData(data)
    .addEvent('#cancel-modify-comment', 'click', this.cancelModifyComment.bind(this, this.uid))
    .addEvent('#submit-modify-comment', 'click', this.modifyComment.bind(this, this.uid))
    .addEvent('.icon[data-icon="thumb_up"]', 'click', this.saveLikeOrDislike.bind(this, 'like', this.uid))
    .addEvent('.icon[data-icon="thumb_down"]', 'click', this.saveLikeOrDislike.bind(this, 'dislike', this.uid))
    .addEvent('.reaction-item.response', 'click', this.toggleReplyForm.bind(this, this.uid, this.id))
    .addEvent('.icon[data-icon="more_horiz"]', 'click', this.toggleMenu.bind(this, this.uid))
    .addEvent('.comment-options-button.edit-comment', 'click', this.toggleModifyComment.bind(this, this.uid))
    .addEvent('.comment-options-button.delete-comment', 'click', this.deleteComment.bind(this, this.uid))
    .addEvent('#cancel-reply', 'click', this.toggleReplyForm.bind(this, this.uid, this.id))
    .addEvent('#submit-reply', 'click', this.saveReply.bind(this, this.content))
    
    // Ajouter l'événement pour '.forum-comment-response' seulement si elle existe
    if (this.children_number > 0) {
      template.addEvent('.forum-comment-response', 'click', this.toggleResponses.bind(this, this.id));
    }

  // Retourner le rendu complet sans l'ajouter au DOM
  return template.render();
}


  /**
 * Génère le code HTML pour afficher un commentaire avec ses réactions et options associées.
 *
 * Cette fonction construit dynamiquement le HTML d'un commentaire, en incluant les informations
 * sur l'auteur, le contenu, la date de création, ainsi que les boutons de réaction (like, dislike, répondre).
 * Le HTML est adapté en fonction des données du commentaire, comme le nombre de likes, dislikes, et réponses.
 *
 * - Les classes CSS sont déterminées pour indiquer si l'utilisateur a déjà réagi (like/dislike).
 * - Le texte des réponses est ajusté pour être au singulier ou au pluriel en fonction du nombre de réponses.
 * - Si le commentaire a des réponses, un élément pour afficher ou masquer les réponses est ajouté.
 *
 * @returns {Object} Un objet HTML généré, prêt à être inséré dans le DOM.
 */

  generateHtml() {
    let likeClass = this.current_user_reacted === 'like' ? 'reaction-item active mr-3' : 'reaction-item mr-3';
    let dislikeClass = this.current_user_reacted === 'dislike' ? 'reaction-item active mr-3' : 'reaction-item mr-3';

    // Détermination du pluriel ou du singulier pour "réponse(s)"
    let reponseText = this.children_number > 1 ? 'réponses' : 'réponse';

    // Générer les initiales de l'utilisateur pour l'image de profil
    let getInitials = function(fullName) {
      const names = fullName.split(' ');
      if (names.length === 0) return '?'; // Aucun nom donné
      const firstInitial = names[0][0] || '';
      const lastInitial = names.length > 1 ? names[names.length - 1][0] : ''; // Garde seulement la dernière partie
      return (firstInitial + lastInitial).toUpperCase();    
    };


    // Générer une couleur de fond aléatoire pour l'image de profil
    let getRandomColor = function() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // Ajout de l'état "en cours d'édition"
    let isEditing = false;

    let html = MelHtml.start
      .div({ id: 'comment-id-' + this.uid, class: 'row comment' })
        .div({ class: 'col-12' })
          .div({ class: 'forum-comment flex align-items-center' })

            // Remplacer l'image par un div avec les initiales et la couleur de fond aléatoire
            .div({
              class: 'forum-comment-profile-image',
              style: 'background-color: ' + getRandomColor() + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;'
            })
            .text(getInitials(this.user_name))
            .end('div')

            .span({ class: 'forum-content-author' }).text(this.user_name).end('span')
          .div({ class: 'forum-comment-date d-flex align-items-end' })
            .span({ class: 'icon', 'data-icon': 'access_time' }).end('span')
            .span({ class: 'ml-1' }).text(this.created).end('span')
          .end('div')
        .end('div')

        // Texte du commentaire, visible par défaut et masqué par le textarea qui suit, lorsqu'on clique sur modifier un commentaire.
        .div({ class: 'forum-comment-text', id: 'comment-text-' + this.uid })
          .p().text(this.content).end('p')
        .end('div')

        // Textarea pour modification d'un commentaire, caché par défaut
        .div({ class: 'forum-comment-edit hidden', id: 'edit-comment-' + this.uid })
            .textarea({ id: 'edit-comment-textarea-' + this.uid, class: 'forum-comment-input', rows: '1' })
            .text(this.content)
            .end('textarea')
            .div({ id: 'buttons-container', class: 'col-12 d-flex justify-content-end align-items-center' })
              .button({ id: 'cancel-modify-comment', type: 'button', class: 'modal-close-footer btn mel-button btn-danger mel-before-remover mr-2', onclick: this.cancelModifyComment.bind(this, this.uid) }).text('Annuler').span({ class: 'plus icon-mel-close' }).end('span')
              .end('button')
              .button({ id: 'submit-modify-comment', type: 'button', class:'modal-save-footer btn btn-secondary mel-button', onclick: this.modifyComment.bind(this, this.uid) }).text('Sauvegarder').span({ class: 'plus icon-mel-arrow-right' }).end('span')
              .end('button')
            .end('div')  
        .end('div')

        .div({ class: 'forum-comment-reactions' })
          .div({ class: likeClass })
            .span({ class: 'icon material-symbols-outlined', 'data-like-uid': this.uid, 'data-icon': 'thumb_up', onclick: this.saveLikeOrDislike.bind(this, 'like', this.uid) }).end('span')
            .span({ class: 'ml-2' }).text(this.likes).end('span')
          .end('div')
          .div({ class: dislikeClass })
            .span({ class: 'icon material-symbols-outlined', 'data-dislike-uid': this.uid, 'data-icon': 'thumb_down', onclick: this.saveLikeOrDislike.bind(this, 'dislike', this.uid) }).end('span')
            .span({ class: 'ml-2' }).text(this.dislikes).end('span')
          .end('div')
          .div({ class: 'reaction-item mr-3 response', onclick: this.toggleReplyForm.bind(this, this.uid, this.id) })
            .span({ class: 'icon', 'data-icon': 'mode_comment' }).end('span')
            .span({ class: 'ml-2' }).text('répondre').end('span')
          .end('div')
          .div({ class: 'reaction-item' })
            .span({ class: 'icon', 'data-icon': 'more_horiz', onclick: this.toggleMenu.bind(this, this.uid) }).end('span')
            .div({ id: 'context-menu-' + this.uid, class: 'forum-comment-context-menu hidden' }) 
              .h3({ id: 'aria-label-groupoptions-smallmenu', class: 'voice' }).text('Menu du commentaire').end('h3')
                .button({ class: 'comment-options-button edit-comment', title: 'Modifier le commentaire', 'aria-labelledby': 'aria-label-comment-options-menu-' + this.uid, 'data-action': 'modify_comment', 'data-id': this.uid, onclick: this.toggleModifyComment.bind(this, this.uid) })
                .removeClass('mel-button')
                .removeClass('no-button-margin')
                .removeClass('no-margin-button')
                .css({ border: 'none', outline: 'none', display: 'flex', alignItems: 'center' })
                .icon('edit')
                .end('icon')
                .span({ class: 'comment-options-text', style: 'margin-left: 8px;' }) .text('Modifier le commentaire')
                .end('span')
                .end('button')
                .button({ class: 'comment-options-button delete-comment', title: 'Supprimer le commentaire', 'aria-labelledby': 'aria-label-comment-options-menu-' + this.uid, 'data-action': 'cancel_comment', 'data-id': this.uid, onclick: this.deleteComment.bind(this, this.uid) })
                .removeClass('mel-button')
                .removeClass('no-button-margin')
                .removeClass('no-margin-button')
                .css({ border: 'none', outline: 'none', display: 'flex', alignItems: 'center' })
                .icon('delete')
                .end('icon')
                .span({ class: 'comment-options-text', style: 'margin-left: 8px;' }) .text('Supprimer le commentaire')
                .end('span')
                .end('button')
            .end('div')
          .end('div')
        .end('div');

    // Ajout du formulaire de réponse masqué
    html = html.div({ id: 'reply-form-'+ this.uid, class: 'row my-4 d-flex align-items-center hidden' })
    .div({ class: 'col-auto pr-0' })
      .div({ class: 'forum-comment-profile-image', style: 'background-color: ' + getRandomColor() + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;' })
        .text(getInitials(this.user_name))
      .end('div')
    .end('div')
    .div({ class: 'col pl-0', style: 'margin-bottom: 1rem;' })
      .textarea({ id: 'new-response-textarea-' + this.uid, class: 'forum-comment-input', placeholder: 'Répondre', rows: '1' }).end('textarea')
    .end('div')
    .div({ id: 'buttons-container', class: 'col-12 d-flex justify-content-end align-items-center'})
      .button({ id: 'cancel-reply', type: 'button', class: 'modal-close-footer btn mel-button btn-danger mel-before-remover mr-2', onclick: this.toggleReplyForm.bind(this, this.uid) }).text('Annuler').span({ class: 'plus icon-mel-close' }).end('span').end('button')
      .button({ id: 'submit-reply', type: 'button', class: 'modal-save-footer btn btn-secondary mel-button', onclick: this.saveReply.bind(this, this.content) }).text('Sauvegarder').span({ class: 'plus icon-mel-arrow-right' }).end('span').end('button')
    .end('div')
    .end('div');

    if (this.children_number > 0) {
      html = html.div({ class: 'forum-comment-response', onclick: this.toggleResponses.bind(this, this.id) })
        .span({ id: 'toggle-icon-' + this.id, class: 'icon', 'data-icon': 'arrow_drop_down' }).end('span')
        .span({ class: 'ml-2' }).text(this.children_number + ' ' + reponseText).end('span')
      .end('div');
    }

    html = html.div({ id: 'responses-' + this.id, class: 'responses ml-4 hidden' })
      .end('div')
    .end('div')
    .end('div');

    return html.generate();
  }
}

class PostCommentView {
  constructor(post_uid, post_id) {
    this._init()._setup(post_uid, post_id)

    this._autoResizeTextarea();
    this._setupButtonVisibility();
    this._setupSaveButton();
    this._setupCancelButton();
 }

  /**
 * Initialise l'objet avec l'identifiant du post.
 *
 * Cette fonction affecte la valeur de `post_uid` à la propriété `post_uid` de l'objet.
 * Elle retourne ensuite l'objet lui-même après l'initialisation.
 *
 * @returns {Object} - L'objet initialisé avec la valeur de `post_uid`.
 */
  _init() {
    this.post_uid = '';
    this.post_id = '';

    return this;

  }

  /**
 * Configure les propriétés `post_uid` et `post_id` de l'objet avec les valeurs spécifiées.
 *
 * Cette fonction utilise `Object.defineProperties` pour définir les propriétés
 * `post_uid` `post_id` de l'objet. Les propriétés ont un getter qui retourne la valeur passée 
 * en paramètre, et un setter qui permet de mettre à jour ces valeurs.
 *
 * @param {string} post_uid - L'uid du post à configurer.
 * @param {string} post_id - L'identifiant du post à configurer.
 */
  _setup(post_uid, post_id) {
    
          this.post_uid = post_uid;
          this.post_id = post_id;
        }
 
  
  /**
   * Configure le redimensionnement automatique du textarea dédié au commentaire en fonction de son contenu.
   */
  _autoResizeTextarea() {
    $(document).on('input', '.forum-comment-input', function () {
      this.style.height = 'auto'; // Réinitialise la hauteur
      this.style.height = (this.scrollHeight) + 'px'; // Ajuste la hauteur
    });
  }

  /**
   * Configure la visibilité des boutons lors du focus et du blur du textarea
   * et permet la réinitialisation du text area lorsqu'on clique sur le bouton 'annuler'.
   */
  _setupButtonVisibility() {
    const $textarea = $('#new-comment-textarea');
    const $buttonsContainer = $('#buttons-container');
    const $cancelButton = $('#cancel-comment');

    // Initialement masqué
    $buttonsContainer.addClass('hidden');

    // Afficher les boutons lorsque le textarea reçoit le focus
    $textarea.on('focus', function() {
        $buttonsContainer.removeClass('hidden');
    });

    // Ajouter l'événement pour le bouton "Annuler"
    $cancelButton.on('click', function() {
        // Réinitialiser le contenu du textarea
        $textarea.val('');

        // Revenir à la taille d'origine
        $textarea.height('auto');

        // Cacher les boutons "Annuler" et "Sauvegarder"
        $buttonsContainer.addClass('hidden');
    });
}


  /**
 * Configure le bouton de sauvegarde pour soumettre un commentaire.
 *
 * Cette fonction associe un gestionnaire d'événements au bouton de sauvegarde 
 * qui récupère le contenu du textarea et appelle la méthode `saveComment` 
 * si le contenu n'est pas vide.
 */
  _setupSaveButton() {
    const $saveButton = $('#submit-comment');
    const $textarea = $('#new-comment-textarea');

    $saveButton.on('click', () => {
        const commentContent = $textarea.val();
        if (commentContent.trim() !== '') {
            this.saveComment(commentContent);
        }
    });
}

   /**
   * Configure le comportement du bouton "Annuler".
   */
   _setupCancelButton() {
    const $cancelButton = $('#cancel-comment');
    const $textarea = $('#new-comment-textarea');
    const $buttonsContainer = $('#buttons-container');

    $cancelButton.on('click', function() {
        $textarea.val('');  // Réinitialiser le contenu du textarea
        $buttonsContainer.addClass('hidden');  // Masquer les boutons "Annuler" et "Sauvegarder"
    });
  }


  /**
 * Enregistre un nouveau commentaire et met à jour l'affichage.
 *
 * Cette fonction envoie le contenu du commentaire à l'API pour le créer, 
 * puis réinitialise le champ de texte et rafraîchit la liste des commentaires 
 * en cas de succès. En cas d'erreur, un message d'erreur est affiché.
 *
 * @async
 * @function saveComment
 * @param {string} content - Le contenu du commentaire à enregistrer.
 * @returns {void}
 * @throws {Error} En cas d'échec de l'enregistrement ou d'une erreur réseau.
 */
async saveComment(content) {
    try {
        const response = await mel_metapage.Functions.post(
            mel_metapage.Functions.url('forum', 'create_comment'),
            {
                _post_id: this.post_id,
                _content: content
            }
        );
        if (response.status === 'success') {
            rcmail.display_message(response.message, 'confirmation');
            $('#new-comment-textarea').val('');  // Réinitialiser le textarea
            this.displayComments();  // Rafraîchir les commentaires après l'ajout
        } else {
            rcmail.display_message(response.message, 'error');
        }
    } catch (error) {
        rcmail.display_message("Une erreur est survenue lors de la sauvegarde du commentaire.", 'error');
        console.error("Erreur lors de la sauvegarde du commentaire:", error);
    }
}


  /**
 * Récupère les commentaires associés à un post spécifique.
 *
 * Cette fonction envoie une requête asynchrone pour obtenir tous les commentaires
 * liés à l'identifiant du post spécifié. Elle utilise une fonction `post` pour
 * envoyer la requête et reçoit les données au format JSON. Les données sont ensuite
 * analysées et retournées par la fonction.
 *
 * @returns {Promise<Object>} - Une promesse qui se résout avec les données des commentaires
 *                              obtenues en réponse à la requête.
 */
  async getCommentByPost() {
    // BnumMessage.SetBusyLoading();
    let return_data;
    await mel_metapage.Functions.post(
      mel_metapage.Functions.url('forum', 'get_all_comments_bypost'),
      { _post_uid: this.post_uid },
      (datas) => {
        return_data = JSON.parse(datas);
        
        // BnumMessage.SetBusyLoading();
      }
    )

    return return_data;

  }

}
