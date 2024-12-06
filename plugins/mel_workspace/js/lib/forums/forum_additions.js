import { WorkspaceObject } from '../WorkspaceObject.js';

class ForumAddition extends WorkspaceObject {
  constructor() {
    super();
  }

  get KEY() {
    return 'forum-updated';
  }

  main() {
    super.main();

    if (this.get_env('task') === 'forum') {
      this.rcmail().addEventListener(
        'forum.post.updated',
        this.forumUpdated.bind(this),
      );

      this.rcmail().addEventListener(
        'forum.post.delete',
        this.forumUpdated.bind(this),
      );
    } else {
      this.onactionreceived.push((data) => {
        if (data.key === this.KEY) {
          let $frame = $('#module-forum-last iframe');

          if ($frame.length) {
            $frame[0].contentWindow.location.reload();
          }
        }
      });
    }
  }

  forumUpdated() {
    WorkspaceObject.SendToWorkspace(this.KEY, true);
  }

  static Start() {
    return new ForumAddition();
  }
}

ForumAddition.Start();
