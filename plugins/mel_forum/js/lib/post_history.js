import { CursorUtils } from '../../../mel_metapage/js/lib/helpers/cursorUtils';
import { JsHtml } from '../../../mel_metapage/js/lib/html/JsHtml/JsHtml';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object';

export class Post_history extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    this.post_uid = this.get_env('post_uid');
    this.history = this.get_env('history') || [];
    this.workspace_uid = this.get_env('workspace_uid');
    this.displayHistory();
    this.setupBackButton();
    this.setupScrollAndBackToTop();
  }

  /**
   * Affiche l'historique des modifications dans la liste.
   *
   * Cette méthode génère et affiche l'historique des modifications dans une liste HTML.
   * Si l'historique est vide, un message informant l'utilisateur qu'il n'y a pas d'historique est affiché.
   * Sinon, chaque entrée de l'historique est ajoutée sous forme d'élément de liste dans l'élément `#history-list`.
   * @return void
   */
  displayHistory() {
    const historyList = $('#history-list');
    const noHistoryMessage = $('#no-history-message');

    historyList.empty();

    if (this.history.length === 0) {
      noHistoryMessage.show();
      return;
    }

    noHistoryMessage.hide();

    // Générer la liste des modifications
    for (let entry of this.history) {
      let listItem = JsHtml.start
        .li({ class: 'history-entry' })
        .text(entry.text)
        .end();

      historyList.append(listItem.generate());
    }
  }

  /**
   * Configuration du bouton de retour à l'article.
   *
   * @return void
   */
  setupBackButton() {
    $('#go-back-to-article').click(() => {
      CursorUtils.SetLoadingCursor();
      window.location.href = this.url('forum', {
        action: 'post',
        params: { _uid: this.post_uid, _workspace_uid: this.workspace_uid },
      });
    });
  }

  /**
   * Configure le comportement du défilement et du bouton "Retour en haut".
   *
   * @return void
   */
  setupScrollAndBackToTop() {
    // Gestion du scroll sur la page
    document.querySelector('.content').addEventListener('scroll', () => {
      const scrollPos = document.querySelector('.content').scrollTop;
      if (scrollPos === 0) {
        $('#backToTop').addClass('hidden'); // Masquer le bouton quand on est tout en haut
      } else {
        $('#backToTop').removeClass('hidden'); // Afficher le bouton si on a défilé
      }
    });

    // Action backToTop (défilement en douceur vers le haut)
    $('#backToTop').click(() => {
      document.querySelector('.content').scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
}
