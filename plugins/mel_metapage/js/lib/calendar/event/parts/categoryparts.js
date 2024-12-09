/**
 * @module EventView/Parts/Categories
 */

import { MelEnumerable } from '../../../classes/enum.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import { MelHtml } from '../../../html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_object.js';
import { TAG_WSP_CATEGORY } from './parts.constants.js';
import { FakePart, Parts } from './parts.js';

/**
 * Gère la partie lié aux catégories
 * @extends FakePart
 * @class
 * @classdesc Gère la partie lié aux catégories, il y a une amélioration de l'affichage entre les catégories et les espaces de travails. De plus ajoute des actions lié aux espaces de travails.
 * @frommodule EventView/Parts
 */
export class CategoryPart extends FakePart {
  /**
   *
   * @param {external:jQuery} $trueCategorySelect Champ select pour les catégories
   * @param {external:jQuery} $falseCategorySelect Champ select visuel pour les cétagories
   * @param {external:jQuery} $falseCheck Checkbox visuel pour afficher ou non le champs des catégories
   * @param {external:jQuery} $icon Icône avant le champ visuel des catégories
   * @param {external:jQuery} $addWorkspaceUserButton Button qui sera afficher si une catégorie est lié à un espace de travail
   */
  constructor(
    $trueCategorySelect,
    $falseCategorySelect,
    $falseCheck,
    $icon,
    $addWorkspaceUserButton,
  ) {
    super($trueCategorySelect, $falseCategorySelect, Parts.MODE.change);
    /**
     * Button qui sera afficher si une catégorie est lié à un espace de travail.
     *
     * Lors du clique il devra ajouter les utilisateurs de l'espace de travail dans le champs des participants.
     * @type {external:jQuery}
     */
    this._$wspButton = $addWorkspaceUserButton;
    /**
     * Checkbox visuel pour afficher ou non le champs des catégories
     * @type {external:jQuery}
     */
    this._$hasCategory = $falseCheck;
    /**
     * Icône avant le champ visuel des catégories
     *
     * Elle change en fonction du type de catégorie
     * @type {external:jQuery}
     */
    this._$icon = $icon;
  }

  /**
   * Initialise la partie.
   * @param {*} event Evènement du plugin `calendar`
   */
  init(event) {
    this._generateCategories()._$wspButton.css('display', 'none');

    if (
      (top ?? parent ?? window).$('html').hasClass('mwsp') &&
      (!event.categories || !event.categories.length)
    ) {
      event.categories = [
        `ws#${MelObject.Empty().load('current_wsp')}`,
      ];
      event.calendar_blocked = 'true';
    }

    if (!!event.categories && event.categories.length > 0) {
      //Si il y a des catégories
      this._$fakeField.val(event.categories[0]);

      if (event.categories[0].includes(TAG_WSP_CATEGORY))
        this._$wspButton.css('display', EMPTY_STRING);

      this._$hasCategory[0].checked = true;
    } else {
      this._$hasCategory[0].checked = false;
      this._$fakeField.parent().parent().css('display', 'none');
    }

    //Gestion de l'évènement du checkbox
    if (!$._data(this._$hasCategory[0], 'events')?.click) {
      const event = () => {
        if (!this._$hasCategory[0].checked) {
          this._$field.val(EMPTY_STRING).change();
          this._$fakeField.parent().parent().css('display', 'none');
        } else {
          this._$field.val(this._$fakeField.val()).change();
          this._$fakeField.parent().parent().css('display', EMPTY_STRING);
        }
      };
      event();
      this._$hasCategory.click(event.bind(this));
    }

    this.updateIcon();

    //Si on a pas l'autorisation de modifier la catégorie
    const blocked = event.calendar_blocked === 'true';

    if (blocked) {
      this._$fakeField.attr('disabled', 'disabled').addClass('disabled');
      this._$hasCategory.attr('disabled', 'disabled').addClass('disabled');
    } else {
      this._$fakeField.removeAttr('disabled').removeClass('disabled');
      this._$hasCategory.removeAttr('disabled').removeClass('disabled');
    }
  }

  /**
   * Génère les catégories du select du champ visuel
   * @private
   * @returns {CategoryPart} Chaîne
   */
  _generateCategories() {
    if (this._$fakeField.children().length === 0) {
      let html = MelHtml.start.option({ value: '' }).text('Aucune').end();
      for (const iterator of Object.keys(CategoryPart.PARTS)) {
        html = html.optgroup({ label: CategoryPart.PARTS[iterator].name });
        for (const category of MelEnumerable.from(
          rcmail.env.calendar_categories,
        )
          .select((x) => x.key)
          .where(CategoryPart.PARTS[iterator].callback)) {
          html = html
            .option({
              value: category,
              'data-icon': CategoryPart.PARTS[iterator].icon,
            })
            .text(CategoryPart.PARTS[iterator].show_callback(category))
            .end();
        }
        html = html.end();
      }

      this._$fakeField.html(html.generate());
    }

    return this;
  }

  /**
   * Met à jour l'icône en fonction de la catégorie sélectionné
   */
  updateIcon() {
    let icon = this._$fakeField.find(':selected').data('icon');

    if (icon || false) this._$icon.html(icon);
    else this._$icon.html('label_off');
  }

  /**
   * Action qui sera effectué lors de la mise à jour du champ visuel
   * @param {string} val Valeur du select
   * @override
   */
  onUpdate(val) {
    if (val.includes('ws#')) this._$wspButton.css('display', EMPTY_STRING);
    else this._$wspButton.css('display', 'none');

    this._$field.val(val).change();
    this.updateIcon();
  }

  /**
   * Action qui sera appelé lors de la mise à jour du champ visuel
   *
   * Appele la fonction @see {@link CategoryPart~onUpdate}
   * @param  {...any} args
   * @event
   * @override
   */
  onChange(...args) {
    let $e = $(args[0].currentTarget);

    this.onUpdate($e.val());
  }
}

/**
 * Contient les données d'un groupe de catégorie
 * @class
 * @classdesc Contient les données d'un groupe de catégorie, ce groupe à un nom, une icône, et 2 fonctions qui vont gérer comment fonctionne se groupe.
 * @package
 */
class CategoryData {
  /**
   *
   * @param {string} name Nom du groupe.
   * @param {string} icon Icône du groupe, il sera affiché lorsque la catégorie est sélectionné.
   * @param {function} callback Défini quels catégories sont dans ce groupe, la fonction retourne un booléen.
   * @param {function | null} show_callback Défini le texte qui sera affiché dans le select, si null alors le texte sera le même que la catégorie.
   */
  constructor(name, icon, callback, show_callback = null) {
    /**
     * Nom du groupe
     * @type {string}
     */
    this.name = name;
    /**
     * Fonction qui défini quel catégorie est dans le groupe
     * @type {function}
     */
    this.callback = callback ?? this._default_callback();
    /**
     * Défini le texte qui sera affiché dans le select
     * @type {function}
     */
    this.show_callback = show_callback ?? ((x) => x);
    /**
     * Icône du groupe
     * @type {string}
     */
    this.icon = icon;
  }

  /**
   * Callback qui prend en paramètre un string. Celui ci sera tester dans le callback et retournera soit vrai, soit faux.
   * @callback StringWhereCallback
   * @param {string} x Elément que l'on souhaite tester
   * @return {boolean}
   */

  /**
   * Sera appelé si aucun callback n'a été défini dans le constructeur.
   * @returns {StringWhereCallback} Callback qui sera appelé ultérieurement, probablement dans une fonction `where`
   */
  _default_callback() {
    return (x) => {
      let bool = true;
      for (const iterator of Object.keys(CategoryPart.PARTS)) {
        if (CategoryPart.PARTS[iterator].name === this.name) continue;

        bool = bool && !CategoryPart.PARTS[iterator].callback(x);

        if (!bool) break;
      }

      return bool;
    };
  }

  /**
   * Génère un groupe de catégorie. Améliore la lisibilité du code.
   * @param {string} name Nom du groupe.
   * @param {string} icon Icône du groupe, il sera affiché lorsque la catégorie est sélectionné.
   * @param {function} callback Défini quels catégories sont dans ce groupe, la fonction retourne un booléen.
   * @param {function | null} show_callback Défini le texte qui sera affiché dans le select, si null alors le texte sera le même que la catégorie.
   * @returns {CategoryData}
   */
  static Part(name, icon, callback, show_callback) {
    return new CategoryData(name, icon, callback, show_callback);
  }
}

/**
 * Contient les données des groupes de catégories
 * @enum {CategoryData}
 * @static
 */
CategoryPart.PARTS = {
  default: CategoryData.Part('Catégorie', 'label', null),
  wsp: CategoryData.Part(
    'Espaces de travail',
    'workspaces',
    (x) => x.includes(TAG_WSP_CATEGORY),
    (x) => x.replace(TAG_WSP_CATEGORY, EMPTY_STRING),
  ),
};
