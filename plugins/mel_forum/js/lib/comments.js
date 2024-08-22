import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export {PostComment, PostCommentView}

class PostComment {
  constructor(uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number) {
    this._init()._setup(uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number)
  }

  /**
 * Initialise un objet avec des valeurs par défaut.
 *
 * Cette fonction réinitialise toutes les propriétés de l'objet, telles que
 * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, et `parent` à des chaînes de caractères vides.
 * Elle retourne l'objet lui-même après l'initialisation.
 *
 * @return {Object} L'objet initialisé avec des valeurs par défaut.
 */
  _init() {
    this.uid = '';
    this.post_id = '';
    this.user_uid = '';
    this.user_name = '';
    this.content = '';
    this.created = '';
    this.likes = 0;
    this.dislikes = 0;
    this.parent = '';
    this.children_number = 0;

  

    return this;

  }

  /**
 * Configure les propriétés de l'objet avec les valeurs spécifiées.
 *
 * Cette fonction utilise `Object.defineProperties` pour définir les propriétés
 * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`, 
 * `dislike`, et `parent` de l'objet. Chaque propriété a un getter qui 
 * retourne la valeur initiale passée en paramètre, et un setter qui permet 
 * de mettre à jour cette valeur.
 *
 * @param {string} uid - L'identifiant unique de l'objet.
 * @param {string} post_id - L'identifiant du post associé.
 * @param {string} user_uid - L'identifiant de l'utilisateur.
 * @param {string} user_name - Le nom de l'utilisateur.
 * @param {string} content - Le contenu du commentaire ou du post.
 * @param {string} created - La date de création.
 * @param {string} likes - Le nombre de likes.
 * @param {string} dislikes - Le nombre de dislikes.
 * @param {string} parent - L'Id du commentaire parent s'il existe'.
 * @param {integer} children_number - Le nombre de réponse au commentaire parent
 */
  _setup(uid, post_id, user_uid, user_name, content, created, likes, dislikes, parent, children_number) {

          this.uid = uid;
          this.post_id = post_id;
          this.user_uid = user_uid;
          this.user_name = user_name;
          this.content = content;
          this.created = created;
          this.likes = likes;
          this.dislikes = dislikes;
          this.parent = parent;
          this.children_number = children_number;
  }
  
  async saveLikeOrDislike(type) {
    let return_data;
    await mel_metapage.Functions.post(
        mel_metapage.Functions.url('forum', 'like_comment'),
        { _comment_id: this.uid, _type: type },
        (datas) => {
            return_data = JSON.parse(datas);
        }
    );
  
    return return_data;
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
    console.log("UID:", this.uid);
    console.log("PostID:", this.post_id);
    console.log("UserID:", this.user_uid);
    console.log("UserName:", this.user_name);
    console.log("Content:", this.content);
    console.log("Created:", this.created);
    console.log("Likes:", this.likes);
    console.log("Dislikes:", this.dislikes);
    console.log("Child:", this.parent);
    //prettier-ignore
    let html = MelHtml.start
      .div({ 
        id: 'comment-id-' + this.uid,
        class: 'row comment'
        })
        .div({ class: 'col-12' })
          .div({ class: 'd-flex align-items-center' })
            .img({
              src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJHSTf2JZC2TYKfMedDvuYWHxHL2h-xMPLDw&s',
              alt: 'Image de profil',
              class: 'forum-comment-profile-image'
              })
            .span({ class: 'forum-content-author' })
              .text(this.user_name)
            .end('span')
          .div({ class: 'forum-comment-date d-flex align-items-end' })
            .span({ class: 'icon', 'data-icon': 'access_time' })
            .end('span')
            .span({ class: 'ml-1' })
              .text(this.created)
            .end('span')
          .end('div')
        .end('div')
        .div({ class: 'forum-comment-text' })
          .p()
            .text(this.content)
          .end('p')
        .end('div')
        .div({ class: 'forum-comment-reactions' })
          .div({ class: 'reaction-item active mr-3' })
            .span({ class: 'icon', 'data-icon': 'thumb_up', onclick: this.saveLikeOrDislike.bind(this, 'like') })
            .end('span')
            .span({ class: 'ml-2' })
              .text(this.likes)
            .end('span')
          .end('div')
          .div({ class: 'reaction-item mr-3' })
            .span({ class: 'icon', 'data-icon': 'thumb_down', onclick: this.saveLikeOrDislike.bind(this, 'dislike') })
            .end('span')
            .span({ class: 'ml-2' })
              .text(this.dislikes)
            .end('span')
          .end('div')
          .div({ class: 'reaction-item mr-3 response' })
            .span({ class: 'icon', 'data-icon': 'mode_comment' })
            .end('span')
            .span({ class: 'ml-2' })
              .text('répondre')
            .end('span')
          .end('div')
          .div({ class: 'reaction-item' })
            .span({ class: 'icon', 'data-icon': 'more_horiz' })
            .end('span')
          .end('div')
        .end('div')
        .div({ class: 'forum-comment-response' })
          .span({ class: 'icon', 'data-icon': 'arrow_drop_down' })
          .end('span')
          .span({ class: 'ml-2' })
            .text(this.children_number + ' réponses')
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
    
          this.post_id = post_id;
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
