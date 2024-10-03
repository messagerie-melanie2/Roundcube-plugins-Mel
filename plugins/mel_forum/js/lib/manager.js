import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';

export class Manager extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    
    // Afficher les commentaires avec le tri par défaut (date ascendant)
    this.displayComments(); 
  
    // Associer l'événement de tri des commentaires au select
    $('#forum-comment-select').change(async (event) => {
      const selectedValue = $(event.target).val(); // Récupérer la valeur sélectionnée
  
      // Vérifier si la valeur sélectionnée est correctement récupérée
      console.log("Option sélectionnée:", selectedValue);
  
      // Appeler displayComments avec l'ordre sélectionné
      await this.displayComments(selectedValue);
    });
  
    this.export('manager');
  
    $('#return-homepage').click(() => {
      window.location.href = this.url('forum', { action: 'index' });
    });
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
async displayComments(order = 'date_asc') {  // Ajout d'un paramètre de tri avec une valeur par défaut
  let PostCommentManager = new PostCommentView(this.get_env('post_uid'), this.get_env('post_id'), this.get_env('sort_order'));
  
  // Passer l'option de tri choisie à la fonction getCommentByPost
  let allComments = await PostCommentManager.getCommentByPost(order);

  let comments_array = [];

  // Ajouter chaque commentaire à un tableau pour traitement
  for (const key in allComments) {
    if (allComments.hasOwnProperty(key)) {
      const comment = allComments[key];
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
        comment.current_user_reacted
      );

      comments_array.push(commentVizualizer);
    }
  }

  // Vider la zone des commentaires avant de ré-afficher les commentaires récupérés
  $('#comment-area').empty();

  // Afficher les commentaires
  for (const commentVizualizer of comments_array) {
    let commentHtml = commentVizualizer.generateHtmlFromTemplate();

    if (!commentVizualizer.parent) {
      $('#comment-area').append(...commentHtml); // Commentaire principal
    } else {
      let parentResponseContainer = $('#responses-' + commentVizualizer.parent);
      if (parentResponseContainer.length === 0) {
        parentResponseContainer = $('<div>', {
          id: 'responses-' + commentVizualizer.parent,
          class: 'responses ml-4'
        });
        $('#comment-id-' + commentVizualizer.parent).append(parentResponseContainer);
      }
      parentResponseContainer.append(...commentHtml); // Réponse
    }
  }

  console.log($('#comment-area').html());
}




  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }
}
