import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';

export class Refresh extends MelObject {
  constructor() {
    super();
    this.dismissedCount = null;
  }

  /**
   * Intialise les variables
   */
  main() {
    super.main();
    this.workspace = this.get_env('workspace_uid')
    this.seenCount = parseInt(this.get_env('post_seen_count')) || 0;
    this.currentCount = parseInt(this.get_env('post_new_count')) || 0;
    
    // Refresh basé sur celui du BNUM
    this.rcmail().addEventListener('mel_metapage_refresh', () => {
      this.checkPostCount();
    });
  }

  /**
   * Vérifie si de nouveaux posts sont disponibles
   */
  checkPostCount() {
    console.log('[REFRESH] Vérification de nouveaux posts...');
    console.trace('[REFRESH] post_seen_count (session):', this.seenCount);

    this.http_internal_post({
      task: 'forum',
      action: 'count_posts',
      params: {
        _workspace_uid: this.workspace,
      },
      on_success: (response) => {
        try {
          const data = JSON.parse(response);
          const latestCount = parseInt(data.count);

          const diff = latestCount - this.seenCount;

          if (diff > 0) {
            // Nouveaux articles
            if (this.dismissedCount === latestCount) {
              console.log('[REFRESH] Banniere déjà ignorée pour ce count :', latestCount);
              return;
            }

            console.log('[REFRESH] Nouveaux articles détectés:', diff);
            if (window.ForumRefreshBanner) ForumRefreshBanner.remove();
            this.displayBanner(diff, latestCount);

          } else if (diff < 0) {
            // Suppressions détectées
            const deletedCount = -diff;
            const dismissId = `d${latestCount}`;

            if (this.dismissedCount === dismissId) {
              console.log('[REFRESH] Bannière suppression déjà ignorée pour ce count :', dismissId);
              return;
            }

            console.log('[REFRESH] Articles supprimés détectés :', deletedCount);
            if (window.ForumRefreshBanner) ForumRefreshBanner.remove();
            this.displayBanner(deletedCount, latestCount, true); // <--- true = suppression

          } else {
            console.log('[REFRESH] Aucun changement');
          }

        } catch (e) {
          console.error("Erreur JSON.parse:", e);
        }
      }
    });
  }

  /**
   * Met à jour le compteur vu côté serveur
   */
  updateSeenPostCount(count) {
    this.http_internal_post({
      task: 'forum',
      action: 'update_seen_post_count',
      params : {
        _workspace_uid: this.workspace,
        _count: count
      },
      on_success: () => {
        this.seenCount = count;
        console.log("[REFRESH] Compteur vu mis à jour avec succès, rechargement...");
        window.location.reload();
      }
    });
  }

  /**
   * Ferme la bannière et met à jour le compteur sans rechargement
   */
  dismissBanner(count = null) {
    if (window.ForumRefreshBanner) {
      ForumRefreshBanner.remove();
      window.ForumRefreshBanner = null;
    }

    if (count !== null) {
      this.dismissedCount = count;
      console.log('[REFRESH] Banniere fermée — dismissedCount =', count);
    }
  }

  /**
   * Crée la bannière d'information
   */
  displayBanner(diff, newCount, isDeleted = false) {
    const templateElement = document.querySelector('#forum_refresh_banner_template');
    if (!templateElement) {
      console.warn('[BANNER] Template non trouvé dans le DOM');
      return;
    }

    const message = diff === 1
      ? `1 ${rcmail.gettext(isDeleted ? 'mel_forum.deleted_single_post' : 'mel_forum.new_single_post_available')}`
      : `${diff} ${rcmail.gettext(isDeleted ? 'mel_forum.deleted_multiple_post' : 'mel_forum.new_multiple_post_available')}`;

    const data = { MESSAGE: message };

    const dismissId = isDeleted ? `d${newCount}` : newCount;

    const template = new MelTemplate()
      .setTemplateSelector('#forum_refresh_banner_template')
      .setData(data)
      .addEvent(
        '.refresh-btn',
        'click',
        this.updateSeenPostCount.bind(this, newCount),
      )
      .addEvent(
        '.refresh-btn',
        'keydown',
        (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.updateSeenPostCount(newCount);
          }
        },
      )
      .addEvent(
        '.dismiss-btn',
        'click',
        this.dismissBanner.bind(this, dismissId),
      )
      .addEvent(
        '.dismiss-btn',
        'keydown',
        (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.dismissBanner(dismissId);
          }
        },
      );

    $('#banner-area').empty();
    $('#banner-area').append(...template.render());

    window.ForumRefreshBanner = document.querySelector('#banner-area .forum-refresh-banner');
  }
}