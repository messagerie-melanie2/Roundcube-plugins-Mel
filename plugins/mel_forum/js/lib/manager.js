import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';

export class Manager extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    this.displayComments();
    window.manager = this;
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
 * @returns {Promise<void>} Retourne une promesse qui est résolue une fois que tous les commentaires sont affichés et que les événements sont attachés.
 */
  async displayComments() {
    // Crée une instance de PostCommentView pour gérer les commentaires d'un post spécifique.
    let PostCommentManager = new PostCommentView('ndWtChyQ4IwabbWjWwlM7Qo9');

    // Récupère tous les commentaires associés au post via une requête asynchrone.
    let allComments = await PostCommentManager.getCommentByPost();

    // Initialise un tableau pour stocker les objets PostComment.
    let comments_array = [];

    // Parcourt tous les commentaires retournés par la requête.
    for (const key in allComments) {
        if (allComments.hasOwnProperty(key)) {
            // Extrait les données de chaque commentaire.
            const comment = allComments[key];

            // Crée une instance de PostComment pour chaque commentaire.
            var commentVizualizer = new PostComment(
                comment.id,
                comment.uid,
                comment.post_id,
                comment.user_id,
                comment.user_name,
                comment.content,
                comment.created,
                comment.likes,
                comment.dislikes,
                comment.parent,
                comment.children_number,
            );

            // Génère le HTML pour ce commentaire et l'ajoute à la zone de commentaires dans le DOM.
            commentVizualizer.generateHtml().appendTo($('#comment-area'));

            // Ajoute l'objet commentVizualizer au tableau de commentaires.
            comments_array.push(commentVizualizer);
        }
    }

    // Attache des événements de clic pour gérer les likes et les dislikes après que tous les commentaires aient été ajoutés au DOM.
    // $('.reaction-item .icon[data-icon="thumb_up"]').on('click', (e) => {
    //     this.handleLikeClick(e.currentTarget);
    //     return false; // Empêche la propagation de l'événement.
    // });

    // $('.reaction-item .icon[data-icon="thumb_down"]').on('click', (e) => {
    //     this.handleDislikeClick(e.currentTarget);
    //     return false; // Empêche la propagation de l'événement.
    // });

    // Affiche les données de tous les commentaires dans la console pour débogage.
    console.log(allComments);
}


  /**
 * Gère les interactions de l'utilisateur pour aimer ou ne pas aimer un commentaire.
 *
 * Cette méthode est appelée lorsqu'un utilisateur clique sur les boutons "like" ou "dislike" d'un commentaire.
 * Elle envoie une requête asynchrone pour enregistrer la réaction, met à jour l'interface utilisateur en conséquence, 
 * et affiche un message de confirmation ou d'erreur en fonction de la réponse du serveur.
 *
 * @async
 * @function
 * @name callLikeOrDislike
 * @param {HTMLElement} element - L'élément HTML sur lequel l'utilisateur a cliqué (bouton "like" ou "dislike").
 * @param {string} type - Le type de réaction, soit "like" soit "dislike".
 * @returns {Promise<void>} Retourne une promesse qui est résolue une fois que la réaction a été traitée.
 *
 * @example
 * // Appeler cette fonction lors du clic sur un bouton "like" ou "dislike"
 * await callLikeOrDislike(element, 'like');
 *
 * @throws {Error} Affiche un message d'erreur si la requête échoue.
 */
  async callLikeOrDislike(element, type) {
    const commentId = $(element).closest('.reaction-item').attr('id').split('-')[2];
    const busy = rcmail.set_busy(true, 'loading');

    try {
      const response = await mel_metapage.Functions.post(
        mel_metapage.Functions.url('forum', 'like_comment'),
        { _comment_id: commentId, _type: type }
      );

      const data = JSON.parse(response);
      rcmail.set_busy(false, 'loading', busy);

      if (data.status === 'success') {
        rcmail.display_message('Votre réaction a été enregistrée avec succès.', 'confirmation');
        
        // Mise à jour de l'interface utilisateur
        if (type === 'like') {
          let likeCounter = $(element).siblings('span.ml-2');
          likeCounter.text(parseInt(likeCounter.text()) + 1);
        } else if (type === 'dislike') {
          let dislikeCounter = $(element).siblings('span.ml-2');
          dislikeCounter.text(parseInt(dislikeCounter.text()) + 1);
        }
      } else {
        rcmail.display_message(data.message, 'error');
      }
    } catch (error) {
      rcmail.set_busy(false, 'loading', busy);
      rcmail.display_message('Une erreur est survenue lors de l\'enregistrement de votre réaction.', 'error');
    }
  }


  /**
 * Gère le clic de l'utilisateur sur l'icône "like" d'un commentaire.
 *
 * Cette fonction met à jour le compteur de likes et l'état visuel de l'icône "like" en fonction de l'interaction de l'utilisateur.
 * Si l'utilisateur a déjà liké, le like est annulé. Si l'utilisateur n'a pas encore liké, le compteur est incrémenté.
 * De plus, si l'utilisateur avait déjà cliqué sur "dislike", ce dernier est annulé automatiquement.
 *
 * @function
 * @name handleLikeClick
 * @param {HTMLElement} element - L'élément HTML représentant l'icône "like" sur lequel l'utilisateur a cliqué.
 *
 * @example
 * // Utilisation de cette fonction lors du clic sur l'icône "like"
 * handleLikeClick(document.querySelector('.icon[data-icon="thumb_up"]'));
 */
  handleLikeClick(element) {
    let likeCounter = $(element).siblings('span.ml-2');
    let likeCount = parseInt(likeCounter.text());

    // Vérifie si l'utilisateur a déjà liké
    if ($(element).hasClass('liked')) {
      likeCounter.text(likeCount - 1);
      $(element).removeClass('liked');
    } else {
      likeCounter.text(likeCount + 1);
      $(element).addClass('liked');

      // Annule le dislike si l'utilisateur a déjà cliqué sur dislike
      let dislikeElement = $(element).closest('.reaction-item').siblings('.reaction-item').find('.icon[data-icon="thumb_down"]');
      if (dislikeElement.hasClass('disliked')) {
        this.handleDislikeClick(dislikeElement[0]);
      }
    }
  }


  /**
 * Gère le clic de l'utilisateur sur l'icône "dislike" d'un commentaire.
 *
 * Cette fonction met à jour le compteur de dislikes et l'état visuel de l'icône "dislike" en fonction de l'interaction de l'utilisateur.
 * Si l'utilisateur a déjà disliké, le dislike est annulé. Si l'utilisateur n'a pas encore disliké, le compteur est incrémenté.
 * De plus, si l'utilisateur avait déjà cliqué sur "like", ce dernier est annulé automatiquement.
 *
 * @function
 * @name handleDislikeClick
 * @param {HTMLElement} element - L'élément HTML représentant l'icône "dislike" sur lequel l'utilisateur a cliqué.
 *
 * @example
 * // Utilisation de cette fonction lors du clic sur l'icône "dislike"
 * handleDislikeClick(document.querySelector('.icon[data-icon="thumb_down"]'));
 */
  handleDislikeClick(element) {
    debugger;
    let dislikeCounter = $(element).siblings('span.ml-2');
    let dislikeCount = parseInt(dislikeCounter.text());

    // Vérifie si l'utilisateur a déjà disliké
    if ($(element).hasClass('disliked')) {
      dislikeCounter.text(dislikeCount - 1);
      $(element).removeClass('disliked');
    } else {
      dislikeCounter.text(dislikeCount + 1);
      $(element).addClass('disliked');

      // Annule le like si l'utilisateur a déjà cliqué sur like
      let likeElement = $(element).closest('.reaction-item').siblings('.reaction-item').find('.icon[data-icon="thumb_up"]');
      if (likeElement.hasClass('liked')) {
        this.handleLikeClick(likeElement[0]);
      }
    }
  }

/**
   * Créé l'input qui permet d'ajouter un commentaire
   */
addComment() {
  let html = MelHtml.start;
  html
    .div({ class: 'row my-2 d-flex align-items-center' })
    .img({
      src: '',
      alt: 'Image de Profil',
      class: 'profile-image-custom ml-4'
    })
    .input({
      type: 'text',
      placeholder: 'Ajouter un commentaire',
      class: 'comment-input-custom',
      style: 'max-height: 40px'
    })
    .end('div')
    .generate()
}


/**
 * Affiche les commentaires sur la page web
 */
Comments() {
  const postUid = $('#post-uid').val();
}

}


