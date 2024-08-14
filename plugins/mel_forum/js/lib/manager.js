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

      // allComments.forEach(element => {
      //   let commentelement = {

      //   }

      //   )

      // });
        window.manager = this;
  }

  async displayComments() {
    let PostCommentManager = new PostCommentView('ndWtChyQ4IwabbWjWwlM7Qo9');
    let allComments = await PostCommentManager.getCommentByPost();
    for (const comment in allComments) {
      commentVizualizer = new PostComment(
        comment.uid,
        comment.post_id,
        comment.user_id,
        comment.user_name,
        comment.content,
        comment.created,
        comment.like,
        comment.dislike,
        comment.child_comment,
      );
      commentVizualizer.generateHtml().appendTo('.comments-items');
    }
    comments_array.push(commentVizualizer);

    console.log(allComments);
    
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







  /**
   * Affiche les commentaires sur la page web
   */
  Comments() {
    const postUid = $('#post-uid').val();
  }

}
