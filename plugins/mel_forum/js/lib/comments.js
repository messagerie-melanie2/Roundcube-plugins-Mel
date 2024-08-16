import { text } from "body-parser";

export {PostComment, PostCommentView}

class PostComment {
  constructor(uid, post_id, user_id, user_name, content, created, like, dislike, child_comment) {

    this._init()._setup(uid, post_id, user_id, user_name, content, created, like, dislike, child_comment)
  }

  /**
 * Initialise un objet avec des valeurs par défaut.
 *
 * Cette fonction réinitialise toutes les propriétés de l'objet, telles que
 * `uid`, `post_id`, `user_id`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, et `child_comment` à des chaînes de caractères vides.
 * Elle retourne l'objet lui-même après l'initialisation.
 *
 * @return {Object} L'objet initialisé avec des valeurs par défaut.
 */
  _init() {
    this.uid = '';
    this.post_id = '';
    this.user_id = '';
    this.user_name = '';
    this.content = '';
    this.created = '';
    this.like = '';
    this.dislike = '';
    this.child_comment = '';

    return this;

  }

  /**
 * Configure les propriétés de l'objet avec les valeurs spécifiées.
 *
 * Cette fonction utilise `Object.defineProperties` pour définir les propriétés
 * `uid`, `post_id`, `user_id`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, et `child_comment` de l'objet. Chaque propriété a un getter qui 
 * retourne la valeur initiale passée en paramètre, et un setter qui permet 
 * de mettre à jour cette valeur.
 *
 * @param {string} uid - L'identifiant unique de l'objet.
 * @param {string} post_id - L'identifiant du post associé.
 * @param {string} user_id - L'identifiant de l'utilisateur.
 * @param {string} user_name - Le nom de l'utilisateur.
 * @param {string} content - Le contenu du commentaire ou du post.
 * @param {string} created - La date de création.
 * @param {string} like - Le nombre de likes.
 * @param {string} dislike - Le nombre de dislikes.
 * @param {string} child_comment - Le nombre de sous-commentaires.
 */
  _setup(uid, post_id, user_id, user_name, content, created, like, dislike, child_comment) {
    Object.defineProperties(this, {

      uid: {
        get() {
          return uid;
        },

        set: (value) => {
          this.uid = value;
        }
      },

      post_id: {
        get() {
          return post_id;
        },

        set: (value) => {
          this.post_id = value;
        }
      },

      user_id: {
        get() {
          return user_id;
        },

        set: (value) => {
          this.user_id = value;
        }
      },

      user_name: {
        get() {
          return user_name;
        },

        set: (value) => {
          this.user_name = value;
        }
      },

      content: {
        get() {
          return content;
        },

        set: (value) => {
          this.content = value;
        }
      },

      created: {
        get() {
          return created;
        },

        set: (value) => {
          this.created = value;
        }
      },

      like: {
        get() {
          return like;
        },

        set: (value) => {
          this.like = value;
        }
      },

      dislike: {
        get() {
          return dislike;
        },

        set: (value) => {
          this.dislike = value;
        }
      },

      child_comment: {
        get() {
          return child_comment;
        },

        set: (value) => {
          this.child_comment = value;
        }
      },
    })
  }

  /**
 * Génère le code HTML pour afficher un commentaire avec ses réactions.
 *
 * Cette fonction crée un ensemble d'éléments HTML représentant un commentaire,
 * avec le profil de l'utilisateur, le contenu du commentaire, les réactions
 * (likes, dislikes, réponses), ainsi que des éléments supplémentaires comme
 * la date de création et le nombre de réponses. Le HTML est construit en 
 * utilisant une syntaxe fluide pour faciliter la lecture et l'écriture.
 *
 * @returns {string} - Le code HTML généré sous forme de chaîne de caractères.
 */
  generateHtml() {
    let html = MelHtml.start
      .div({ 
        id: 'comment_id-' + this.uid,
        class: 'row comment'
       })
      .div({ class: 'col-12' })
      .div({ class: 'd-flex align-items-center' })
      .img({
        src: 'this.##',
        alt: 'Image de profil',
        class: 'forum-comment-profile-image'
       })
       .span({ class: 'forum-content-author' })
       .text(this.user_name)
       .end('span')
       .div({ class: 'forum-comment-date d-flex align-items-end' })
       .i({ class: 'material-symbols-outlined' })
       .text('access_time')
       .end('i')
       .span({ class: 'ml-1' })
       .text(this.created)
       .end('span')
       .end('div')
       .end('div')
       .div({ class: 'forum-comment-text' })
       .p(this.content)
       .end('p')
       .end('div')
       .div({ class: 'forum-comment-reactions' })
       .div({ class: 'reaction-item active mr-3' })
       .i({ class: 'material-symbols-outlined' })
       .text('thumb-up')
       .end('i')
       .span({ class: 'ml-2' })
       .text(this.like)
       .end('span')
       .end('div')
       .div({ class: 'reaction-item mr-3' })
       .i({ class: 'material-symbols-outlined' })
       .text('thumb-down')
       .end('i')
       .span({ class: 'ml-2' })
       .text(this.dislike)
       .end('span')
       .end('div')
       .div({ class: 'reaction-item mr-3 response' })
       .i({ class: 'material-symbols-outlined' })
       .text('mode_comment')
       .end('i')
       .span({ class: 'ml-2' })
       .text('répondre')
       .end('span')
       .end('div')
       .div({ class: 'reaction-item' })
       .i({ class: 'material-symbols-outlined' })
       .text('more_horiz')
       .end('i')
       .end('div')
       .end('div')
       .div({ class: 'forum-comment-responses' })
       .i({ class: 'material-symbols-outlined' })
       .text('arrow_drop_down')
       .end('i')
       .span({ class: 'ml-2' })
       .text(this.nb_reponse)
       .end('span')
       .end('div')
       .end('div')
       .end('div');

    return html.generate();
 }

}

class PostCommentView {
  constructor(post_id) {
    this._init()._setup(post_id)
  }

  /**
 * Initialise l'objet avec l'identifiant du post.
 *
 * Cette fonction affecte la valeur de `post_id` à la propriété `post_id` de l'objet.
 * Elle retourne ensuite l'objet lui-même après l'initialisation.
 *
 * @returns {Object} - L'objet initialisé avec la valeur de `post_id`.
 */
  _init() {
    this.post_id = this.post_id;

    return this;

  }

  /**
 * Configure la propriété `post_id` de l'objet avec les valeurs spécifiées.
 *
 * Cette fonction utilise `Object.defineProperties` pour définir la propriété 
 * `post_id` de l'objet. La propriété a un getter qui retourne la valeur passée 
 * en paramètre, et un setter qui permet de mettre à jour cette valeur.
 *
 * @param {string} post_id - L'identifiant du post à configurer.
 */
  _setup(post_id) {
    Object.defineProperties(this, {

      post_id: {
        get() {
          return post_id;
        },

        set: (value) => {
          this.post_id = value;
        }
      }
    });
  }

  /**
 * Récupère les commentaires associés à un post spécifique.
 *
 * Cette fonction envoie une requête asynchrone pour obtenir tous les commentaires
 * liés à l'identifiant du post spécifié. Elle utilise une fonction `post` pour
 * envoyer la requête et reçoit les données au format JSON. Les données sont ensuite
 * analysées et retournées par la fonction.
 *
 * @returns {Promise<Object>} - Une promesse qui se résout avec les données des commentaires
 *                              obtenues en réponse à la requête.
 */
  async getCommentByPost() {
    // BnumMessage.SetBusyLoading();
    let return_data;
    await mel_metapage.Functions.post(
      mel_metapage.Functions.url('forum', 'get_all_comments_bypost'),
      { _post_id: this.post_id },
      (datas) => {
        return_data = JSON.parse(datas);
        
        // BnumMessage.SetBusyLoading();
      }
    )

    return return_data;

  }

}
