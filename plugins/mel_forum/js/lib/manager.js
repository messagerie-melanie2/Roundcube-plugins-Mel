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
    this.export('manager');
    $('#return-homepage').click(() => {
      window.location.href = this.url('forum',{action:'index'});
  })
    //window.manager = this;
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
    // Obtenir tous les commentaires du post
    let PostCommentManager = new PostCommentView(this.get_env('post_uid'), this.get_env('post_id'));
    let allComments = await PostCommentManager.getCommentByPost();
    let comments_array = [];

    // Parcourir tous les commentaires
    for (const key in allComments) {
        if (allComments.hasOwnProperty(key)) {
            const comment = allComments[key];

            // Créer une instance de PostComment pour chaque commentaire
            let commentVizualizer = new PostComment(
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
                comment.current_user_reacted,
            );

            // Générer le HTML avec les valeurs dynamiques insérées
            let commentHtml = commentVizualizer.generateHtmlFromTemplate();

            // Si le commentaire n'a pas de parent, c'est un commentaire principal
            if (!comment.parent) {
                // Insérer le commentaire principal dans la zone de commentaires
                $('#comment-area').append(commentHtml);
            } else {
                // C'est une réponse (ou une réponse à une réponse)
                let parentResponseContainer = $('#responses-' + comment.parent);

                // Vérifier si le conteneur de réponses existe
                if (parentResponseContainer.length === 0) {
                    // Créer un conteneur pour les réponses si besoin
                    parentResponseContainer = $('<div>', {
                        id: 'responses-' + comment.parent,
                        class: 'responses ml-4'
                    });

                    // Insérer ce conteneur sous le commentaire parent
                    $('#comment-id-' + comment.parent).append(parentResponseContainer);
                }

                // Ajouter la réponse dans le conteneur de réponses
                parentResponseContainer.append(commentHtml);
            }

            comments_array.push(commentVizualizer);
        }
    }

    // Délégation d'événements pour les éléments dynamiques
    $('#comment-area').on('click', '.edit-comment', function() {
        let uid = $(this).data('id');
        toggleModifyComment(uid);
    });

    $('#comment-area').on('click', '.delete-comment', function() {
        let uid = $(this).data('id');
        deleteComment(uid);
    });

    $('#comment-area').on('click', '.icon[data-icon="thumb_up"]', function() {
        let uid = $(this).data('like-uid');
        saveLikeOrDislike('like', uid);
    });

    $('#comment-area').on('click', '.icon[data-icon="thumb_down"]', function() {
        let uid = $(this).data('dislike-uid');
        saveLikeOrDislike('dislike', uid);
    });

    $('#comment-area').on('click', '.response', function() {
        let uid = $(this).closest('.row').attr('id').split('-')[2];
        toggleReplyForm(uid);
    });

    $('#comment-area').on('click', '#submit-modify-comment', function() {
        let uid = $(this).closest('.forum-comment-edit').attr('id').split('-')[2];
        modifyComment(uid);
    });

    $('#comment-area').on('click', '#submit-reply', function() {
        saveReply();
    });

    $('#comment-area').on('click', '.forum-comment-response', function() {
        let commentId = $(this).attr('data-comment-id');
        console.log(commentId);
        
        // toggleResponses(commentId);
    });


    // Affiche les données de tous les commentaires dans la console pour débogage.
    console.log($('#comment-area').html()); // Affiche le contenu du DOM avec les valeurs dynamiques
}




  



 

  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }
}
