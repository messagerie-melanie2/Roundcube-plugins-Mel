export {PostComment, PostCommentView}

class PostComment {
  constructor(uid, post_id, user_id, user_name, content, created, like, dislike, child_comment) {

    this._init()._setup(uid, post_id, user_id, user_name, content, created, like, dislike, child_comment)
  }

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

    // generateHtml(comments_array) {
  //   let html = MelHtml.start;
  //   html
  //     .div({ class: 'comments-container mt-4' });

  //   comments_array(comment => {
  //     //Commentaire
  //     html
  //       .div({ class: 'comment-item-custom ml-4' })
  //       .div({ class: 'd-flex align-items-center' })
  //       .img({
  //         src: '',
  //         alt: 'Image de Profil',
  //         class: 'profile-image-custom'
  //       })
  //       .div({ class: 'ml-2' })
  //       .span({ class: 'comment-author-custom' })
  //       .text(creator)
  //       .end('span')
  //       .div({ class: 'd-flex align-items-center' })
  //       .i({ class: 'material-symbols-outlined' })
  //       .text('access_time')
  //       .end('i')
  //       .span({ class: 'ml-2' })
  //       .text(date)
  //       .end('span')
  //       .end('div')
  //       .end('div');

  //     //Contenu du commentaire
  //     html
  //       .div({ class: 'comment-content' })
  //       .p()
  //       .text(content)
  //       .end(p)
  //       .end(div);

  //     //Likes et nombre de réponses
  //     html
  //       .div({ class: 'Likes flex align-items-center mt-2' })
  //       .div({ class: 'Like-item d-flex align-items-center mr-3' })
  //       .i({ class: 'material-symbols-outlined' })
  //       .text('thumb_up')
  //       .end('i')
  //       .span({ class: 'ml-2' })
  //       .text(comment.likes)
  //       .end('span')
  //       .end('div')
  //       .div({ class: 'Like-item d-flex align-items-center mr-3' })
  //       .i({ class: 'material-symbols-outlined' })
  //       .text('thumb_down')
  //       .end('i')
  //       .span({ class: 'ml-2' })
  //       .text(comment.dislikes)
  //       .end('span')
  //       .end('div')
  //       .div({ class: 'reaction-item d-flex align-items-center' })
  //       .i({ class: 'material-symbols-outlined' })
  //       .text('comment')
  //       .end('i')
  //       .span({ class: 'ml-2' })
  //       .text(`x réponses`)
  //       .end('span')
  //       .i({ class: 'material-symbols-outlined' })
  //       .text('keyboard_arrow_down')
  //       .end('i')
  //       .end('div')
  //       .end('div');

  //   }),

  //     html
  //       .end('div');

  //   return html.generate();
  // };

}

class PostCommentView {
  constructor(post_id) {
    this._init()._setup(post_id)
  }

  _init() {
    this.post_id = this.post_id;

    return this;

  }

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
