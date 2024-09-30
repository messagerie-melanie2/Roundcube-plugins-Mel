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

    // Associer l'événement de tri des commentaires au select
    $('#forum-comment-select').change(async (event) => {
      const selectedValue = $(event.target).val(); // Récupérer la valeur sélectionnée

      // Vérifier si la valeur sélectionnée est correctement récupérée
      console.log("Option sélectionnée:", selectedValue);
      
      if (selectedValue === 'default') {
      // Appeler displayComments avec l'ordre sélectionné
      await this.displayComments();
      } else {
        await this.displayComments(selectedValue);
      }
    
    });

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
  async displayComments(order = 'date_asc') {
    let PostCommentManager = new PostCommentView(this.get_env('post_uid'), this.get_env('post_id'));
    let allComments = await PostCommentManager.getCommentByPost();
    let comments_array = [];

    // Fonction pour convertir le format de la date
    const parseDate = (dateString) => {
        const months = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
        };
        const parts = dateString.split(' ');
        const day = parseInt(parts[0], 10);
        const month = months[parts[1]];
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    };

    // Ajouter chaque commentaire à un tableau pour traitement
    for (const key in allComments) {
        if (allComments.hasOwnProperty(key)) {
            const comment = allComments[key];
            let commentVizualizer = new PostComment(
                comment.id, comment.uid, comment.post_id, comment.user_id, comment.user_name,
                comment.content, comment.created, comment.likes, comment.dislikes,
                comment.parent, comment.children_number, comment.current_user_reacted
            );
            comments_array.push(commentVizualizer);
        }
    }
    debugger;
    // Appliquer le tri en fonction de l'ordre spécifié
    if (order === 'date_asc') {
        comments_array.sort((a, b) => parseDate(a.created) - parseDate(b.created)); // Plus anciens d'abord
    } else if (order === 'date_desc') {
        comments_array.sort((a, b) => parseDate(b.created) - parseDate(a.created)); // Plus récents d'abord
        comments_array.sort((a, b) => a.parent - b.parent);
    } else if (order === 'likes_desc') {
        comments_array.sort((a, b) => a.parent === b.parent ? b.likes - a.likes : parseDate(a.created) - parseDate(b.created)); // Plus de likes
    } else if (order === 'dislikes_desc') {
        comments_array.sort((a, b) => a.parent === b.parent ? b.dislikes - a.dislikes : parseDate(a.created) - parseDate(b.created)); // Plus de dislikes
    } else if (order === 'default') {
        // Ne pas trier, laisser dans l'ordre récupéré par getCommentByPost
    }

    // Vider la zone des commentaires avant de ré-afficher les commentaires triés
    $('#comment-area').empty();

    // Afficher les commentaires triés
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
