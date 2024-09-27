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
    // Obtenir tous les commentaires du post
    let PostCommentManager = new PostCommentView(this.get_env('post_uid'), this.get_env('post_id'));
    let allComments = await PostCommentManager.getCommentByPost();
    let comments_array = [];

    // Fonction pour convertir le format de la date (qui est 24 septembre 2024)
    const parseDate = (dateString) => {
      const months = {
          janvier: 0,
          février: 1,
          mars: 2,
          avril: 3,
          mai: 4,
          juin: 5,
          juillet: 6,
          août: 7,
          septembre: 8,
          octobre: 9,
          novembre: 10,
          décembre: 11,
      };

      const parts = dateString.split(' '); // Diviser la chaîne
      const day = parseInt(parts[0], 10); // Le jour
      const month = months[parts[1]]; // Le mois (converti en index)
      const year = parseInt(parts[2], 10); // L'année

      return new Date(year, month, day); // Créer un objet Date
  };

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

            // Ajouter chaque commentaire à la liste des commentaires pour un éventuel traitement ultérieur
            comments_array.push(commentVizualizer);
        }
    }

     // Appliquer le tri en fonction de l'ordre spécifié
     if (order === 'date_asc') {
        comments_array.sort((a, b) => parseDate(b.created) - parseDate(a.created));
    } else if (order === 'date_desc') {
        comments_array.sort((a, b) => parseDate(a.created) - parseDate(b.created));
    } else if (order === 'likes_desc') {
        comments_array.sort((a, b) => b.likes - a.likes);
    } else if (order === 'dislikes_desc') {
        comments_array.sort((a, b) => b.dislikes - a.dislikes);
    }

    // Vider la zone des commentaires avant de ré-afficher les commentaires triés
    $('#comment-area').empty();

    // Afficher les commentaires triés
    for (const commentVizualizer of comments_array) {
        // Générer le HTML avec les valeurs dynamiques insérées
        let commentHtml = commentVizualizer.generateHtmlFromTemplate();

        // Si le commentaire n'a pas de parent, c'est un commentaire principal
        if (!commentVizualizer.parent) {
            // Insérer le commentaire principal dans la zone de commentaires
            $('#comment-area').append(...commentHtml);
        } else {
            // C'est une réponse (ou une réponse à une réponse)
            let parentResponseContainer = $('#responses-' + commentVizualizer.parent);

            // Vérifier si le conteneur de réponses existe
            if (parentResponseContainer.length === 0) {
                // Créer un conteneur pour les réponses si besoin
                parentResponseContainer = $('<div>', {
                    id: 'responses-' + commentVizualizer.parent,
                    class: 'responses ml-4'
                });

                // Insérer ce conteneur sous le commentaire parent
                $('#comment-id-' + commentVizualizer.parent).append(parentResponseContainer);
            }

            // Ajouter la réponse dans le conteneur de réponses
            parentResponseContainer.append(...commentHtml);
        }
    }

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
