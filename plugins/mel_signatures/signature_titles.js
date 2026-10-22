/**
 * Administration des libellés de signature (ticket 0009463)
 *
 * - filtre la liste pendant la saisie dans <bnum-input-search> (design system Bnum) ;
 * - met à jour le compteur (« 120 libellé(s) ») avec le nombre de lignes visibles ;
 * - affiche « Aucun résultat » quand la recherche ne trouve rien ;
 * - Échap, ou le bouton de vidage du composant, réaffiche toute la liste ;
 * - soumet le formulaire des boutons du design system portant data-submit : ces composants
 *   ne sont pas liés aux formulaires HTML (ils ne sont pas « form-associated ») ;
 * - demande confirmation avant l'envoi des formulaires portant un attribut data-confirm.
 */
(() => {
  'use strict';

  /**
   * Masque les libellés dont le nom ne contient pas le texte recherché, met le compteur à jour
   * et affiche le message « Aucun résultat » si rien ne correspond.
   * @param {HTMLElement & { value: string }} search Composant bnum-input-search
   */
  function filterList(search) {
    const value = (search.value || '').trim().toLowerCase();
    const noResult = document.getElementById('signature-titles-no-result');
    const count = document.getElementById('signature-titles-count');
    const list = document.querySelector('.signature-titles-list');
    let visible = 0;

    document.querySelectorAll('.signature-titles-list li').forEach((item) => {
      item.hidden = value !== '' && !(item.dataset.label || '').includes(value);

      if (!item.hidden) {
        visible++;
      }
    });

    // data-template contient « $count libellé(s) » : on y met le nombre de lignes visibles
    if (count && count.dataset.template) {
      count.textContent = count.dataset.template.replace('$count', String(visible));
    }

    // Aucune ligne visible : le cadre vide de la liste est masqué, le message prend sa place
    if (list) {
      list.hidden = visible === 0;
    }

    if (noResult) {
      noResult.hidden = visible > 0;
    }
  }

  /**
   * Soumet le formulaire d'un bouton du design system : celui que désigne data-form,
   * sinon celui qui contient le bouton. requestSubmit() déclenche l'événement « submit »,
   * donc la confirmation ci-dessous et les contrôles du navigateur (required, maxlength).
   * @param {HTMLElement} button Bouton bnum-…-button portant data-submit
   */
  function submitFromButton(button) {
    const form = button.dataset.form
      ? document.getElementById(button.dataset.form)
      : button.closest('form');

    form?.requestSubmit();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('signature-titles-filter');

    if (search) {
      search.addEventListener('input', () => filterList(search));
      search.addEventListener('bnum-input-search:clear', () => filterList(search));

      // Échap vide aussi la recherche
      search.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && search.value !== '') {
          event.preventDefault();
          search.value = '';
          filterList(search);
        }
      });

      // Le navigateur peut avoir conservé une saisie (retour arrière) : on applique le filtre tout de suite
      filterList(search);
    }

    document.querySelectorAll('[data-submit]').forEach((button) => {
      button.addEventListener('click', () => submitFromButton(button));
    });

    // Confirmation avant les suppressions (formulaires portant data-confirm)
    document.querySelectorAll('form[data-confirm]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        if (!window.confirm(form.dataset.confirm)) {
          event.preventDefault();
        }
      });
    });
  });
})();
