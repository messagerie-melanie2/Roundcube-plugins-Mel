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
    Manager.displayComments(); 
  
    // Associer l'événement de tri des commentaires au select
    $('#forum-comment-select').change(async (event) => {
      const selectedValue = $(event.target).val(); // Récupérer la valeur sélectionnée
  
      // Vérifier si la valeur sélectionnée est correctement récupérée
      console.log("Option sélectionnée:", selectedValue);
  
      // Appeler displayComments avec l'ordre sélectionné
      await Manager.displayComments(selectedValue);
    });
  
    this.export('manager');
  
    $('#return-homepage').click(() => {
      window.location.href = this.url('forum', { action: 'index' });
    });
  }


// /**
//    * Affiche les commentaires associés à un post spécifique dans l'interface utilisateur.
//    *
//    * Cette méthode récupère tous les commentaires liés à un post en utilisant une instance de `PostCommentView`.
//    * Les commentaires sont ensuite instanciés en tant qu'objets `PostComment`, leur contenu HTML est généré et ajouté
//    * dynamiquement au DOM. Des événements de clic pour les boutons "like" et "dislike" sont également attachés après
//    * l'affichage des commentaires.
//    *
//    * @async
//    * @function
//    * @name displayComments
//    * @returns {Promise<void>} Retourne une promesse qui est résolue une fois que tous les commentaires sont affichés et que les événements sont attachés.
//    */
// async displayComments(order = 'date_asc') {  // Ajout d'un paramètre de tri avec une valeur par défaut
//   let PostCommentManager = new PostCommentView(this.get_env('post_uid'), this.get_env('post_id'), this.get_env('sort_order'));
  
//   // Passer l'option de tri choisie à la fonction getCommentByPost
//   let allComments = await PostCommentManager.getCommentByPost(order);

//   let comments_array = [];

//   // Ajouter chaque commentaire à un tableau pour traitement
//   for (const key in allComments) {
//     if (allComments.hasOwnProperty(key)) {
//       const comment = allComments[key];
//       let commentVizualizer = new PostComment(
//         comment.id,
//         comment.uid,
//         comment.post_id,
//         comment.user_id,
//         comment.user_name,
//         comment.content,
//         comment.created,
//         comment.likes,
//         comment.dislikes,
//         comment.parent,
//         comment.children_number,
//         comment.current_user_reacted
//       );

//       comments_array.push(commentVizualizer);
//     }
//   }

//   // Vider la zone des commentaires avant de ré-afficher les commentaires récupérés
//   $('#comment-area').empty();

//   // Afficher les commentaires
//   for (const commentVizualizer of comments_array) {
//     let commentHtml = commentVizualizer.generateHtmlFromTemplate();

//     if (!commentVizualizer.parent) {
//       $('#comment-area').append(...commentHtml); // Commentaire principal
//     } else {
//       let parentResponseContainer = $('#responses-' + commentVizualizer.parent);
//       if (parentResponseContainer.length === 0) {
//         parentResponseContainer = $('<div>', {
//           id: 'responses-' + commentVizualizer.parent,
//           class: 'responses ml-4'
//         });
//         $('#comment-id-' + commentVizualizer.parent).append(parentResponseContainer);
//       }
//       parentResponseContainer.append(...commentHtml); // Réponse
//     }
//   }

//   console.log($('#comment-area').html());
// }


static async displayComments(order = 'date_asc', parent_comment_id = null) {  
  debugger;
  let PostCommentManager = new PostCommentView(rcmail.env.post_uid, rcmail.env.post_id, order, parent_comment_id);

  // Passer l'option de tri choisie à la fonction getCommentByPost
  let allComments = await PostCommentManager.getCommentByPost();

  let comments_array = [];
  let responses_array = [];

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
  } else {
    if (responses_array != []) {
        for (const response of responses_array) {
          let responseHtml = response.generateHtmlFromTemplate();
          $(`#responses-${parent_comment_id}`).removeClass('hidden');
          $(`#responses-${parent_comment_id}`).append(...responseHtml);
        }
      }
  }
}


  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }
}
