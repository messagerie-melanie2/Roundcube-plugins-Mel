import { text } from "body-parser";

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
