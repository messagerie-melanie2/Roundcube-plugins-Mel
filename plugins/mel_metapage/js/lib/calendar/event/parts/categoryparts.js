import { MelEnumerable } from "../../../classes/enum.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { FakePart, Parts } from "./parts.js";

export class CategoryPart extends FakePart{
    constructor($trueCategorySelect, $falseCategorySelect, $falseCheck, $icon, $addWorkspaceUserButton) {
        super($trueCategorySelect, $falseCategorySelect, Parts.MODE.change);
        this._$wspButton = $addWorkspaceUserButton;
        this._$hasCategory = $falseCheck;
        this._$icon = $icon;
    }

    init(event) {
        this._generateCategories()._$wspButton.css('display', 'none');

        if (!!event.categories && event.categories.length > 0) {
            this._$fakeField.val(event.categories[0]);

            if (event.categories[0].includes('ws#')) this._$wspButton.css('display', EMPTY_STRING);

            this._$hasCategory[0].checked = true;
        }
        else 
        {
            this._$hasCategory[0].checked = false;
            this._$fakeField.parent().parent().css('display', 'none');
        }

        if (!$._data(this._$hasCategory[0], 'events' )?.click) {
            const event = () => {
                if (!this._$hasCategory[0].checked) {
                    this._$field.val(EMPTY_STRING).change();
                    this._$fakeField.parent().parent().css('display', 'none');
                }
                else {
                    this._$field.val(this._$fakeField.val()).change();
                    this._$fakeField.parent().parent().css('display', EMPTY_STRING);
                }
            };
            event();
            this._$hasCategory.click(event.bind(this));
        }

        this.updateIcon();

        const blocked = 'true' === event.calendar_blocked;

        if (blocked) {
            this._$fakeField.attr('disabled', 'disabled').addClass('disabled');
            this._$hasCategory.attr('disabled', 'disabled').addClass('disabled');
        } 
        else {
            this._$fakeField.removeAttr('disabled').removeClass('disabled');
            this._$hasCategory.removeAttr('disabled').removeClass('disabled');
        }
    }

    updateIcon() {
        let icon = this._$fakeField.find(":selected").data('icon')

        if (!!(icon || false)) this._$icon.html(icon);
        else this._$icon.html('label_off');
    }

    onUpdate(val) {
        if (val.includes('ws#')) this._$wspButton.css('display', EMPTY_STRING);
        else this._$wspButton.css('display', 'none');

        this._$field.val(val).change();
        this.updateIcon();
    }

    onChange(...args) {
        let $e = $(args[0].currentTarget);

        this.onUpdate($e.val());
    }

    _generateCategories() {
        if (0 === this._$fakeField.children().length) {
            let html = MelHtml.start.option({value:''}).text('Aucune').end();
            for (const iterator of Object.keys(CategoryPart.PARTS)) {
                html = html.optgroup({label:CategoryPart.PARTS[iterator].name});
                for (const category of MelEnumerable.from(rcmail.env.calendar_categories).select(x => x.key).where(CategoryPart.PARTS[iterator].callback)) {
                    html = html.option({value:category, 'data-icon':CategoryPart.PARTS[iterator].icon}).text(CategoryPart.PARTS[iterator].show_callback(category)).end();
                }
                html = html.end();
            }

            this._$fakeField.html(html.generate());
        }

        return this;
    }
}

class CategoryData {
    constructor(name, icon, callback, show_callback = null) {
        this.name = name;
        this.callback = callback ?? this._default_callback();
        this.show_callback = show_callback ?? (x => x);
        this.icon = icon;
    }

    _default_callback() {
        return x => {
            let bool = true;
            for (const iterator of Object.keys(CategoryPart.PARTS)) {
                if (CategoryPart.PARTS[iterator].name === this.name) continue;

                bool = bool && !CategoryPart.PARTS[iterator].callback(x);

                if (!bool) break;
            }

            return bool;
        };
    }

    static Part(name, icon, callback, show_callback) {
        return new CategoryData(name, icon, callback, show_callback);
    }
}

CategoryPart.PARTS = {
    default: CategoryData.Part('Catégorie', 'label', null),
    wsp: CategoryData.Part('Espaces de travail', 'workspaces', x => x.includes('ws#'), x => x.replace('ws#', EMPTY_STRING)),
}