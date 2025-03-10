import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/program/WorkspaceObject.js';
import { formatPostDate } from './utils.js';

export class Front_page_post extends MelObject {
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
    this.initPinPostsDisplay();
    WorkspaceObject.SendToParent('loaded_pin', true);

    //Recharge les données au refresh
    this.rcmail().addEventListener('mel_metapage_refresh', () => {
      this.http_internal_get({
        task: 'forum',
        action: 'refresh_front_page_post',
        params: {
          _workspace_uid: this.get_env('_workspace_uid'),
        },
        on_success: (data) => {
          $('#pin_post-area').text(EMPTY_STRING);
          this.rcmail().env.posts_data = JSON.parse(data);
          this.initPinPostsDisplay();
          WorkspaceObject.SendToParent('loaded_pin', true);
        },
      });
    });
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
   * Initialise l'affichage du post épinglé.
   * Récupère les données du post depuis l'environnement et détermine
   * s'il faut cacher le cadre.
   *
   * @method initPinPostsDisplay
   * @returns {void}
   */
  initPinPostsDisplay() {
    const posts = this.get_env('posts_data');
    if (posts.length === 0) {
      this.NoPost(posts.length);
    }
    this.displayPinPost(posts);
  }

  /**
   * Affiche le post épinglé en utilisant les données fournies.
   * Génère dynamiquement le contenu des posts à partir des modèles,
   * rend les posts accessibles via le clavier, et ajoute des gestionnaires d'événements
   * pour les clics et interactions associées.
   *
   * @method displayPinPost
   * @param {Object} posts - Objet contenant les données des posts, indexé par ID de post.
   * @returns {void}
   */
  displayPinPost(posts) {
    let post;
    let data;
    for (let postId in posts) {
      post = posts[postId];

      // Vérifiez si une image est présente
      const hasImage = post.image_url && post.image_url.trim() !== '';

      data = {
        POST_LINK: post.post_link,
        POST_CREATOR: post.post_creator,
        CREATOR_EMAIL: post.creator_email,
        POST_DATE: formatPostDate(post.creation_date),
        UID: post.uid,
        POST_CONTENT_CLASS: hasImage
          ? 'col-md-10 col-xl-10'
          : 'col-12 no-image-padding',
        POST_TITLE: post.title,
        POST_SUMMARY: post.summary,
        POST_IMAGE: post.image_url,
        POST_IMAGE_SECTION: hasImage
          ? `<div class="col-12 col-md-2 col-xl-2">
             <img src="${post.image_url}" alt="" class="post-image">
           </div>`
          : '', // Vide si aucune image n'est présente
        //POST_COUNT_REACTION: post.reaction,
        POST_THUMB_UP: post.like_count.toString(),
        POST_THUMB_DOWN: post.dislike_count.toString(),
        POST_COMMENTS: post.comment_count.toString(),
        POST_FAVORITE: MelHtml.start
          .tag('i', {
            id: 'favorite-' + post.uid,
            tabindex: '0',
            title: post.favorite
              ? 'Supprimer de mes favoris'
              : 'Ajouter à mes favoris',
            class: `hoverable icon favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`,
          })
          .text('star_border')
          .end()
          .generate_html({}),
        POST_IS_LIKED: post.isliked ? 'filled' : '',
        POST_IS_DISLIKED: post.isdisliked ? 'filled' : '',
        HAS_OWNER_RIGHTS: post.has_owner_rights ? '' : 'hidden',
        IS_ADMIN: post.is_admin ? '' : 'hidden',
        COMMENTS_ENABLED: post.settings?.comments ? '' : 'hidden',
      };

      let template = new MelTemplate()
        .setTemplateSelector('#pin_post_template')
        .setData(data);
      // .addEvent('#more-'+post.uid, 'click', this.toggleMenuPost.bind(this, post.uid))
      //.addEvent(balise, action, fonction)

      $('#pin_post-area').append(...template.render());

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
          .setData(tag_data)
          .addEvent(
            '.tag-' + post.tags[tag].id,
            'click',
            this.searchPostByTag.bind(this, post.tags[tag].name),
          );

        $('#new-tag-area-' + post.uid).append(...tag_template.render());
      }
      this.offset++;
    }
  }

  /**
   * Affiche les posts le tag sur lequel on a cliqué
   * @param {*} tag_name
   * @param {*} event
   */
  searchPostByTag(tag_name, event) {
    event.preventDefault();
    event.stopPropagation();
    WorkspaceObject.SendToParent('tagClicked', {
      _tag_name: urlencode('#' + tag_name),
    });
  }

  /**
   * Affiche ou non la frame en si il y a un psot épinglé
   * @param post_number
   */
  NoPost(post_number) {
    WorkspaceObject.SendToParent('fontPagePost', {
      _front_page_post: post_number,
    });
  }
}
