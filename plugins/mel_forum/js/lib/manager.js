import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PostComment, PostCommentView } from './comments.js';

export class Manager extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    
    // Charger l'ordre de tri depuis le LocalStorage, sinon utiliser 'date_desc' par défaut
    const savedSortOrder = localStorage.getItem('commentSortOrder') || 'date_asc';

    // Assigner la valeur sauvegardée au select pour afficher la sélection correcte
    $('#forum-comment-select').val(savedSortOrder);

    // Afficher les commentaires avec l'ordre de tri récupéré (ou par défaut si aucun tri sauvegardé)
    Manager.displayComments(savedSortOrder); 
  
    // Associer l'événement de changement de tri au select
    $('#forum-comment-select').change(async (event) => {
      const selectedValue = $(event.target).val(); // Récupérer la valeur sélectionnée

      // Vérifier si la valeur sélectionnée est correctement récupérée
      console.log("Option sélectionnée:", selectedValue);

      // Sauvegarder la sélection dans le LocalStorage
      localStorage.setItem('commentSortOrder', selectedValue);

      // Appeler displayComments avec l'ordre sélectionné
      await Manager.displayComments(selectedValue);
    });
  
    // Exporter 'manager'
    this.export('manager');
  
    // Redirection à la page d'accueil au clic sur 'return-homepage'
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
static async displayComments(order = 'date_desc', parent_comment_id = null) {  
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
   * Affiche un commentaire dans la section appropriée de l'interface utilisateur.
   *
   * @param {Object} comment - L'objet commentaire à afficher.
   * @param {number} comment.id - L'identifiant unique du commentaire.
   * @param {string} comment.uid - L'identifiant unique de l'utilisateur ayant posté le commentaire.
   * @param {number} comment.post_id - L'identifiant du post auquel le commentaire appartient.
   * @param {number} comment.user_id - L'identifiant de l'utilisateur ayant posté le commentaire.
   * @param {string} comment.user_name - Le nom de l'utilisateur ayant posté le commentaire.
   * @param {string} comment.content - Le contenu du commentaire.
   * @param {string} comment.created - La date de création du commentaire au format 'YYYY-MM-DD HH:mm:ss'.
   * @param {number} [comment.likes=0] - Le nombre de likes sur le commentaire (0 par défaut).
   * @param {number} [comment.dislikes=0] - Le nombre de dislikes sur le commentaire (0 par défaut).
   * @param {number} [comment.parent=null] - L'identifiant du commentaire parent si le commentaire est une réponse, sinon `null`.
   * @param {number} [comment.children_number=0] - Le nombre de réponses à ce commentaire (0 par défaut).
   * @param {boolean} [comment.current_user_reacted=false] - Indique si l'utilisateur actuel a réagi au commentaire (false par défaut).
   *
   * Crée une instance de `PostComment` pour le commentaire fourni, génère le HTML associé et l'ajoute à la section appropriée :
   * - Si le commentaire n'a pas de parent, il est ajouté directement à la zone de commentaires principale.
   * - Si le commentaire est une réponse, il est ajouté au conteneur des réponses du commentaire parent. Si ce conteneur n'existe pas encore, il est créé.
   *
   */
  static async displaySingleComment(comment) {

    // Formater la date et l'heure du commentaire avant de passer les données à PostComment
    const formattedDate = new Date(comment.created).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(comment.created).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Créer l'objet PostComment avec les données du commentaire
    let commentVizualizer = new PostComment(
      comment.id,
      comment.uid,
      comment.post_id,
      comment.user_id,
      comment.user_name,
      comment.content,
      `${formattedDate} à ${formattedTime}`,
      comment.likes,
      comment.dislikes,
      comment.parent,
      comment.children_number,
      comment.current_user_reacted
    );

    // Générer le HTML pour le commentaire
    let commentHtml = $(commentVizualizer.generateHtmlFromTemplate());

    // Si le commentaire est un commentaire principal (sans parent)
    if (!comment.parent) {
      // Avant de prépendre, vérifie si le commentaire est déjà dans le DOM
      if (!$('#comment-area').find(`#comment-${comment.id}`).length) {
          // Ajouter le commentaire en haut de la liste des commentaires principaux
          $('#comment-area').prepend(commentHtml);
      }
    } else {
      // Si c'est une réponse à un commentaire parent
      let parent_comment_id = comment.parent;

      // Assurer que la zone des réponses est visible
      $(`#responses-${parent_comment_id}`).removeClass('hidden');

      // Avant de prépendre, vérifie si la réponse est déjà dans le DOM
      if (!$(`#responses-${parent_comment_id}`).find(`#comment-${comment.id}`).length) {
          // Ajouter la réponse en haut des réponses du commentaire parent
          $(`#responses-${parent_comment_id}`).prepend(commentHtml);
      }
    }
  }
}