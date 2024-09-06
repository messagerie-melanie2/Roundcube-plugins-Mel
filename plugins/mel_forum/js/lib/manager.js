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
    debugger;
    // Obtenir tous les commentaires du post
    let PostCommentManager = new PostCommentView(this.get_env('post_uid'),this.get_env('post_id'));
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

            let commentHtml = commentVizualizer.generateHtml();
            // Si le commentaire n'a pas de parent, c'est un commentaire principal
            if (!comment.parent) {
                commentHtml.appendTo($('#comment-area'));
            } else {
                // Sinon, c'est une réponse (ou une réponse à une réponse)
                let parentResponseContainer = $('#responses-' + comment.parent);
                
                if (parentResponseContainer.length === 0) {
                    // Si le conteneur de réponses n'existe pas, le créer sous le commentaire parent
                    commentHtml.appendTo(parentResponseContainer);
                }
                
                commentHtml.appendTo(parentResponseContainer);
            }

            comments_array.push(commentVizualizer);
        }
    }

    // Affiche les données de tous les commentaires dans la console pour débogage.
    console.log(allComments);
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
        class: 'profile-image-custom ml-4',
      })
      .input({
        type: 'text',
        placeholder: 'Ajouter un commentaire',
        class: 'comment-input-custom',
        style: 'max-height: 40px',
      })
      .end('div')
      .generate();
  }

  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }
}
