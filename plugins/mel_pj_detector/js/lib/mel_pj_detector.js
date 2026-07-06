// PAMELA - 0009194 : détection pièce jointe manquante
window.addEventListener('load', function() {

  // Helper détection PJ manquante
  rcmail._mentions_attachment = function(text) {
    const keywords = this.env.missing_attachment_keywords || [],
      case_sensitive = this.env.missing_attachment_case_sensitive || false,
      haystack = case_sensitive ? text : text.toLowerCase();

    for (let i = 0; i < keywords.length; i++) {
      const needle = case_sensitive ? keywords[i] : keywords[i].toLowerCase();
      if (needle && haystack.indexOf(needle) !== -1) {
        return true;
      }
    }
    return false;
  };

  // Interception de l'envoi
  rcmail.addEventListener('beforesend', function() {
    const attachments = rcmail.env.attachments || {},
      has_attachments = Object.keys(attachments).length > 0;

    if (!has_attachments) {
      let body_text = '';

      if (window.tinyMCE && tinyMCE.get(rcmail.env.composebody)) {
        body_text = tinyMCE.get(rcmail.env.composebody).getContent({ format: 'text' });
      }
      else {
        const ta = document.getElementById(rcmail.env.composebody);
          if (ta) body_text = ta.value || '';
      }

      if (rcmail.env.missing_attachment_check_subject) {
        const subj = $('[name=\'_subject\']').val() || '';
        body_text += ' ' + subj;
      }

      if (rcmail._mentions_attachment(body_text)) {
        if (!confirm(rcmail.get_label('missingattachmentconfirm', 'mel_pj_detector'))) {
          return false;
        }
      }
    }
  });
});