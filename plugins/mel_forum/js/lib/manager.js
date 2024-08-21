import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';

export class Manager extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    debugger;
    this.displayComments();
    window.manager = this;
  }

  async displayComments() {
    let PostCommentManager = new PostCommentView('ndWtChyQ4IwabbWjWwlM7Qo9');
    let allComments = await PostCommentManager.getCommentByPost();
    let comments_array = [];

    for (const key in allComments) {
        if (allComments.hasOwnProperty(key)) {
            const comment = allComments[key];
            var commentVizualizer = new PostComment(
                comment.uid,
                comment.post_id,
                comment.user_id,
                comment.user_name,
                comment.content,
                comment.created,
                comment.like,
                comment.dislike,
                comment.child_comment,
            );
            commentVizualizer.generateHtml().appendTo($('#comment-area'));
            comments_array.push(commentVizualizer);
        }
    }

    // Attacher les événements de clic après que tous les commentaires aient été ajoutés au DOM
    $('.reaction-item .icon[data-icon="thumb_up"]').on('click', (e) => {
        this.handleLikeClick(e.currentTarget);
        return false;
    });

    $('.reaction-item .icon[data-icon="thumb_down"]').on('click', (e) => {
        this.handleDislikeClick(e.currentTarget);
        return false;
    });

    console.log(allComments);
  }

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

  // Fonction pour gérer le clic sur l'icône de like
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

  // Fonction pour gérer le clic sur l'icône de dislike
  handleDislikeClick(element) {
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


