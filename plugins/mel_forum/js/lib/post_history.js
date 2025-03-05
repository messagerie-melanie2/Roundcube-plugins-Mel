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
    this.displayHistory();
    this.setupBackButton();
  }

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

  setupBackButton() {
    $('#go-back-to-article').click(() => {
      CursorUtils.SetLoadingCursor();
      window.location.href = this.url('forum', {
        action: 'post',
        params: { _uid: this.post_uid },
      });
    });
  }
}
