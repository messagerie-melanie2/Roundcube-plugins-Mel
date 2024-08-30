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
    // Crée une instance de PostCommentView pour gérer les commentaires d'un post spécifique.
    let PostCommentManager = new PostCommentView('ndWtChyQ4IwabbWjWwlM7Qo9');

    // Récupère tous les commentaires associés au post via une requête asynchrone.
    let allComments = await PostCommentManager.getCommentByPost();

    // Initialise un tableau pour stocker les objets PostComment.
    let comments_array = [];

    // Parcourt tous les commentaires retournés par la requête.
    let commentVizualizer;
    for (const key in allComments) {
      if (allComments.hasOwnProperty(key)) {
        // Extrait les données de chaque commentaire.
        const comment = allComments[key];

        // Crée une instance de PostComment pour chaque commentaire.
        commentVizualizer = new PostComment(
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

        // Génère le HTML pour ce commentaire et l'ajoute à la zone de commentaires dans le DOM.
        commentVizualizer.generateHtml().appendTo($('#comment-area'));

        // Ajoute l'objet commentVizualizer au tableau de commentaires.
        comments_array.push(commentVizualizer);
      }
    }

    commentVizualizer = null;

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
