/**
 * Ajuste dynamiquement la page de login à la fenêtre, sans barre de scroll.
 *
 * On mesure le formulaire réel puis on applique, dans l'ordre du moins au plus
 * intrusif, le strict minimum nécessaire pour qu'il tienne. Chaque étape est
 * dosée en continu (recherche dichotomique) : rien n'est modifié s'il y a la
 * place, et on s'arrête dès que ça tient.
 *   1. espacements réduits (aucun texte touché) ;
 *   2. titre réduit ;
 *   3. baseline décorative retirée ;
 *   4. Cerbère et identifiant côte à côte (conservé seulement si utile),
 *      puis étapes 1 et 2 de nouveau ;
 *   5. dernier recours : réduction proportionnelle (`transform: scale`).
 * Sans JavaScript, la page garde son comportement normal (scroll possible).
 */
(() => {
  const FORM_ID = 'mel-login-form';
  const ACTIVE_CLASS = 'login-fit-active';
  const NO_BASELINE_CLASS = 'login-fit-no-baseline';
  const COLUMNS_CLASS = 'login-fit-columns';
  const SPACE_VAR = '--login-fit-space';
  const TITLE_MAX_SHRINK = 0.45;
  const MIN_SCALE = 0.5;
  const BOTTOM_MARGIN = 8;
  const SEARCH_STEPS = 7;

  const root = document.documentElement;

  /**
   * Mesure le contenu réel du formulaire. Le conteneur lui-même peut être
   * étiré par `main` (flex) jusqu'en bas de la fenêtre : sa hauteur ne dit
   * donc rien de la place réellement utilisée.
   *
   * @param {HTMLElement} form - Conteneur du formulaire
   * @returns {{top: number, bottom: number, height: number}} Position du contenu
   */
  const content_box = (form) => {
    const top = form.getBoundingClientRect().top;
    const last = form.lastElementChild ?? form;
    const bottom = last.getBoundingClientRect().bottom;

    return { top, bottom, height: bottom - top };
  };

  /**
   * Indique si le formulaire dépasse de la fenêtre (hauteur ou largeur).
   *
   * @param {HTMLElement} form - Conteneur du formulaire
   * @returns {boolean} Vrai si une partie du formulaire est hors écran
   */
  const overflows = (form) => {
    const rect = form.getBoundingClientRect();

    return (
      content_box(form).bottom + BOTTOM_MARGIN > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth
    );
  };

  /**
   * Cherche la plus petite valeur de `apply` (entre 0 et 1) pour laquelle le
   * formulaire tient. Laisse `apply(1)` en place si rien ne suffit.
   *
   * @param {HTMLElement} form - Conteneur du formulaire
   * @param {function(number): void} apply - Applique un niveau d'intensité
   * @returns {boolean} Vrai si le formulaire tient à l'issue de la recherche
   */
  const find_minimum = (form, apply) => {
    apply(0);
    if (!overflows(form)) return true;

    apply(1);
    if (overflows(form)) return false;

    let low = 0;
    let high = 1;
    for (let i = 0; i < SEARCH_STEPS; ++i) {
      const middle = (low + high) / 2;
      apply(middle);
      if (overflows(form)) low = middle;
      else high = middle;
    }

    apply(high);
    return true;
  };

  const set_space = (level) => root.style.setProperty(SPACE_VAR, String(level));

  /**
   * Fournit la fonction qui réduit le titre d'un niveau donné.
   *
   * @param {HTMLElement} title - Le titre `h1`
   * @param {number} base_size - Taille d'origine du titre, en pixels
   * @returns {function(number): void} Applique un niveau de réduction
   */
  const title_shrinker = (title, base_size) => (level) => {
    title.style.fontSize =
      level > 0 ? `${base_size * (1 - TITLE_MAX_SHRINK * level)}px` : '';
  };

  /**
   * Applique le strict nécessaire : espacements d'abord, puis titre.
   * Repart de zéro pour ne pas garder de réduction devenue inutile.
   *
   * @param {HTMLElement} form - Conteneur du formulaire
   * @param {function(number): void} shrink_title - Réducteur du titre
   * @returns {boolean} Vrai si le formulaire tient
   */
  const compact = (form, shrink_title) => {
    set_space(0);
    shrink_title(0);

    return find_minimum(form, set_space) || find_minimum(form, shrink_title);
  };

  /**
   * Garde l'étape colonnes seulement si elle réduit la hauteur sans déborder.
   *
   * @param {HTMLElement} form - Conteneur du formulaire
   * @param {number} height_before - Hauteur avant l'étape
   * @returns {boolean} Vrai si l'étape est conservée
   */
  const keep_columns = (form, height_before) => {
    const rect = form.getBoundingClientRect();

    return rect.right <= window.innerWidth && content_box(form).height < height_before;
  };

  /**
   * Réduit proportionnellement le formulaire (dernier recours).
   *
   * @param {HTMLElement} form - Conteneur du formulaire (sans transformation)
   */
  const apply_scale = (form) => {
    const rect = form.getBoundingClientRect();
    const content = content_box(form);
    const scale = Math.max(
      MIN_SCALE,
      Math.min(
        1,
        (window.innerHeight - content.top - BOTTOM_MARGIN) / content.height,
        window.innerWidth / rect.width,
      ),
    );

    if (scale < 1) form.style.transform = `scale(${scale})`;
  };

  const reset = (form, title) => {
    root.classList.add(ACTIVE_CLASS);
    root.classList.remove(NO_BASELINE_CLASS, COLUMNS_CLASS);
    root.style.removeProperty(SPACE_VAR);
    form.style.transform = '';
    title.style.fontSize = '';
  };

  const fit = () => {
    const form = document.getElementById(FORM_ID);
    const title = form?.querySelector('.login-title h1');
    if (!form || !title) return;

    reset(form, title);
    if (!overflows(form)) return;

    const shrink_title = title_shrinker(title, parseFloat(getComputedStyle(title).fontSize));

    if (compact(form, shrink_title)) return;

    root.classList.add(NO_BASELINE_CLASS);
    if (compact(form, shrink_title)) return;

    const height_before = content_box(form).height;
    root.classList.add(COLUMNS_CLASS);
    if (!keep_columns(form, height_before)) {
      root.classList.remove(COLUMNS_CLASS);
    } else if (compact(form, shrink_title)) {
      return;
    }

    apply_scale(form);
  };

  let frame = null;
  const schedule_fit = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      fit();
    });
  };

  window.addEventListener('resize', schedule_fit);
  window.addEventListener('load', schedule_fit);
  document.addEventListener('DOMContentLoaded', schedule_fit);
  if (document.fonts?.ready) document.fonts.ready.then(schedule_fit);

  // Les composants du design system se rendent après le chargement : on
  // réajuste dès qu'ils sont définis, puis une fois leur rendu stabilisé.
  ['bnum-card', 'bnum-input-username', 'bnum-input-password'].forEach((tag) => {
    customElements.whenDefined(tag).then(() => {
      schedule_fit();
      setTimeout(schedule_fit, 300);
      setTimeout(schedule_fit, 1000);
    });
  });
})();
