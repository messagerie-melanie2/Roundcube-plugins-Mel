import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class Manager extends MelObject {
  constructor() {

  }

  main() {
    this.displayComments();

    this.blindActions();

    window.manager = this;
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
        class: 'profile-image-custom ml-4'
      })
      .input({
        type: 'text',
        placeholder: 'Ajouter un commentaire',
        class: 'comment-input-custom',
        style: 'max-height: 40px'
      })
      .end('div')
      .generate()
  }


  displayComments(comments_array) {
    let html = MelHtml.start;
    html
      .div({ class: 'comments-container mt-4'});

    comments_array(comment => {
    //Commentaire
    html
      .div({ class: 'comment-item-custom ml-4'})
      .div({ class: 'd-flex align-items-center'})
      .img({
        src: '',
        alt: 'Image de Profil',
        class: 'profile-image-custom'
      })
      .div({ class: 'ml-2'})
      .span({ class: 'comment-author-custom' })
      .text(creator)
      .end('span')
      .div({ class: 'd-flex align-items-center'})
      .i({ class: 'material-symbols-outlined'})
      .text('access_time')
      .end('i')
      .span({ class: 'ml-2'})
      .text(date)
      .end('span')
      .end('div')
      .end('div');

    //Contenu du commentaire
    html
      .div({ class: 'comment-content'})
      .p()
      .text(content)
      .end(p)
      .end(div);

    //Likes et nombre de réponses
    html
      .div({ class: 'Likes flex align-items-center mt-2' })
      .div({ class: 'Like-item d-flex align-items-center mr-3' })
      .i({ class: 'material-symbols-outlined' })
      .text('thumb_up')
      .end('i')
      .span({ class: 'ml-2' })
      .text(comment.likes)
      .end('span')
      .end('div')
      .div({ class: 'Like-item d-flex align-items-center mr-3' })
      .i({ class: 'material-symbols-outlined' })
      .text('thumb_down')
      .end('i')
      .span({ class: 'ml-2' })
      .text(comment.dislikes)
      .end('span')
      .end('div')
      .div({ class: 'reaction-item d-flex align-items-center' })
      .i({ class: 'material-symbols-outlined' })
      .text('comment')
      .end('i')
      .span({ class: 'ml-2' })
      .text(`x réponses`)
      .end('span')
      .i({ class: 'material-symbols-outlined' })
      .text('keyboard_arrow_down')
      .end('i')
      .end('div')
      .end('div');

    }),

    html
      .end('div');

    return html.generate();
  };




  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }

}
