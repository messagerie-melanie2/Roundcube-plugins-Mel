import { WorkspaceObject } from '../WorkspaceObject.js';

/**
 * Addon pour les forum
 * @module Workspace/Addon/Forum
 * @local ForumAddition
 */

/**
 * @class
 * @classdesc Envoie des données aux espaces de travail lorsqu'il y a des modifications dans les forum
 */
class ForumAddition extends WorkspaceObject {
  /**
   * Hérite de {@link WorkspaceObject}.
   *
   * Le tag extends n'est pas utiliser pour ne pas afficher les éléments de {@link WorkspaceObject} qui gènerait la lisbilité de la documentation.
   */
  constructor() {
    super();
  }

  /**
   * @type {string}
   * @default 'forum-updated'
   * @readonly
   */
  get KEY() {
    return 'forum-updated';
  }

  /**
   * Code principal
   */
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

  /**
   * Action à faire lorsqu'un article est supprimé ou créé.
   * @listens create_or_edit_post~event:forum.post.updated
   * @listens Forum~event:forum.post.delete
   */
  forumUpdated() {
    WorkspaceObject.SendToWorkspace(this.KEY, true);
  }

  /**
   * Démarre le module
   * @returns {ForumAddition}
   */
  static Start() {
    return new ForumAddition();
  }
}

ForumAddition.Start();
