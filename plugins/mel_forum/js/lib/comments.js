import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

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
 * Affiche ou masque le formulaire de réponse.
 */
toggleReplyForm(uid, parentId) {
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

              // Rafraîchir les commentaires après l'ajout
              this.displayComments();  
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
        .div({ class: 'forum-comment-text' })
          .p().text(this.content).end('p')
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
            .span({ class: 'icon', 'data-icon': 'more_horiz' }).end('span')
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
      .button({ id: 'submit-reply', type: 'button', class: 'modal-save-footer btn btn-secondary mel-button', onclick: this.saveReply.bind(this, this.content) }).text('Sauvegarder').span({ class: 'plus icon-mel-arrow-right'}).end('span').end('button')
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
