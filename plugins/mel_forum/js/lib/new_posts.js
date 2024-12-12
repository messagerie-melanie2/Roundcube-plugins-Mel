import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/WorkspaceObject.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export class New_posts extends MelObject {
  constructor() {
    super();
  }

  /**
   * Point d'entrée principal de l'application.
   * Appelle la méthode principale de la classe parente,
   * initialise les propriétés et configure les éléments de l'interface utilisateur.
   *
   * @method main
   * @returns {void}
   */
  main() {
    super.main();

    this.tags = [];
    this.initButtons();
    this.initNewPostsDisplay();
    WorkspaceObject.SendToParent('loaded', true);
  }

  /**
   * Initialise les gestionnaires d'événements pour les boutons.
   * Configure l'action du bouton de vue du forum pour rediriger vers la page du forum.
   *
   * @method initButtons
   * @returns {void}
   */
  initButtons() {
    $('#forum-button-view').click(() => {
      window.location.href = this.url('forum', { action: 'index' });
    });
  }

  /**
   * Initialise l'affichage des nouveaux posts.
   * Récupère les données des posts depuis l'environnement et détermine
   * s'il faut afficher un message d'absence de posts ou les nouveaux posts.
   *
   * @method initNewPostsDisplay
   * @returns {void}
   */
  initNewPostsDisplay() {
    const posts = this.get_env('posts_data');
    if (posts.length === 0) {
      this.displayNoPost();
    }
    this.displayNewPosts(posts);
  }

  /**
   * Affiche les nouveaux posts en utilisant les données fournies.
   * Génère dynamiquement le contenu des posts à partir des modèles,
   * rend les posts accessibles via le clavier, et ajoute des gestionnaires d'événements
   * pour les clics et interactions associées.
   *
   * @method displayNewPosts
   * @param {Object} posts - Objet contenant les données des posts, indexé par ID de post.
   * @returns {void}
   */
  displayNewPosts(posts) {
    let post;
    let data;
    for (let postId in posts) {
      post = posts[postId];
      data = {
        POST_LINK: post.post_link,
        POST_CREATOR: post.post_creator,
        CREATOR_EMAIL: post.creator_email,
        POST_DATE: post.creation_date,
        UID: post.uid,
        POST_TITLE: post.title,
        //POST_COUNT_REACTION: post.reaction,
        POST_THUMB_UP: post.like_count.toString(),
        POST_THUMB_DOWN: post.dislike_count.toString(),
        POST_COMMENTS: post.comment_count.toString(),
        POST_IS_LIKED: post.isliked ? 'filled' : '',
        POST_IS_DISLIKED: post.isdisliked ? 'filled' : '',
      };

      let template = new MelTemplate()
        .setTemplateSelector('#new_post_template')
        .setData(data);
      // .addEvent('#more-'+post.uid, 'click', this.toggleMenuPost.bind(this, post.uid))
      //.addEvent(balise, action, fonction)

      $('#new_post-area').append(...template.render());

      // Rendre chaque post cliquable au clavier
      const postElement = document.getElementById(`post-${post.uid}`);
      postElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const link = postElement.querySelector('.post-card');
          if (link) {
            link.click(); // Simule un clic sur le lien
          }
        }
      });

      // Ajout du gestionnaire de clic pour envoyer l'événement "postClicked"
      const postLink = document.querySelector(`#post-${post.uid} a.post-card`);
      if (postLink) {
        postLink.setAttribute('data-spied', false);
        postLink.addEventListener(
          'click',
          function (uid, event) {
            event.preventDefault();
            // Envoi des données au parent avec les informations du post
            WorkspaceObject.SendToParent('postClicked', {
              _uid: uid,
            });
          }.bind(this, post.uid),
        );
      }

      for (let tag in post.tags) {
        let tag_data = {
          TAG_NAME: '#' + post.tags[tag].name,
          TAG_ID: post.tags[tag].id,
        };
        let tag_template = new MelTemplate()
          .setTemplateSelector('#new_tag_template')
          .setData(tag_data);

        $('#new-tag-area-' + post.uid).append(...tag_template.render());
      }
      this.offset++;
    }
  }

  /**
   * Affiche un message indiquant qu'il n'y a aucun post dans l'espace de travail
   */
  displayNoPost() {
    let noPostDiv = MelHtml.start
      .span({ class: 'ml-2' })
      .text(rcmail.gettext('mel_forum.no_post'))
      .end();
    $('#new_post-area').append(noPostDiv.generate());
  }
}
