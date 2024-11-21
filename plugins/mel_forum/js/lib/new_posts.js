import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';

export class New_posts extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.tags = [];
    this.initButtons();
    this.initNewPostsDisplay();
  }

  initButtons() {
    $('#forum-button-view').click(() => {
      window.location.href = this.url('forum', {action: 'index'});
    })
  }

  initNewPostsDisplay () {
    const posts = this.get_env('posts_data');
    this.displayNewPosts(posts);
  }

  /**
     * affiche les posts passés en paramètres dans la div post-area
     * @param {*} posts 
     */
  displayNewPosts(posts) {
    debugger;
    let post;
    let data;
    for (let postId in posts) {
        post = posts[postId];
        data = {
            POST_LINK: post.post_link,
            POST_CREATOR: post.post_creator,
            POST_DATE: post.creation_date,
            UID: post.uid,
            POST_TITLE: post.title,
            POST_SUMMARY: post.summary,
            POST_IMAGE: post.image_url,
            //POST_COUNT_REACTION: post.reaction,
            POST_THUMB_UP: post.like_count,
            POST_THUMB_DOWN: post.dislike_count,
            POST_COMMENTS: post.comment_count,
            POST_IS_LIKED: post.isliked ? "filled" : "",
            POST_IS_DISLIKED: post.isdisliked ? "filled" : "",
            };

        let template = new MelTemplate()
        .setTemplateSelector('#new_post_template')
        .setData(data)
        // .addEvent('#more-'+post.uid, 'click', this.toggleMenuPost.bind(this, post.uid))
        //.addEvent(balise, action, fonction)

        $('#new_post-area').append(...template.render());

        for (let tag in post.tags) {
            let tag_data = {
                TAG_NAME: '#' + post.tags[tag].name,
                TAG_ID: post.tags[tag].id,
            }
        let tag_template = new MelTemplate()
        .setTemplateSelector('#new_tag_template')
        .setData(tag_data)
        
        $('#new-tag-area-'+post.uid).append(...tag_template.render());
        }
        this.offset ++;
    }
}
}