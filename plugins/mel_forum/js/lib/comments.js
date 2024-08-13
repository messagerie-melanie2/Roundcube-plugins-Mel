import { RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal";

class MelCommentVisualizer extends MelPostComment {
  constructor(uid, post_id, user_id, content, created, like, dislike, child_comment) {

    this._init()._setup(uid, post_id, user_id, content, created, like, dislike, child_comment)
  }

  _init() {
    this.uid = '';
    this.post_id = '';
    this.user_id = '';
    this.content = '';
    this.created = '';
    this.like = '';
    this.dislike = '';
    this.child_comment = '';

    return this;

  }

  _setup(uid, post_id, user_id, content, created, like, dislike, child_comment) {
    Object.defineProperties(this, {

      uid: {
        get() {
          return this.uid;
        },

        set: (value) => {
          this.uid = value;
        }
      },

      post_id: {
        get() {
          return this.post_id;
        },

        set: (value) => {
          this.post_id = value;
        }
      },

      user_id: {
        get() {
          return this.user_id;
        },

        set: (value) => {
          this.user_id = value;
        }
      },

      content: {
        get() {
          return this.content;
        },

        set: (value) => {
          this.content = value;
        }
      },

      created: {
        get() {
          return this.created;
        },

        set: (value) => {
          this.created = value;
        }
      },

      like: {
        get() {
          return this.like;
        },

        set: (value) => {
          this.like = value;
        }
      },

      dislike: {
        get() {
          return this.dislike;
        },

        set: (value) => {
          this.dislike = value;
        }
      },

      child_comment: {
        get() {
          return this.child_comment;
        },

        set: (value) => {
          this.child_comment = value;
        }
      },
    })
  }

  displayPostComment() {

  }
  
async getCommentByPost(task = 'mel_forum', action = 'get_all_comments_bypost'){
  let return_data = [];
  await mel_metapage.Functions.comment(
    mel_metapage.Functions.url(task, action),
    (datas) => {
      rcmail.set_busy(false, 'loading', busy);
    }
  )

}
}
