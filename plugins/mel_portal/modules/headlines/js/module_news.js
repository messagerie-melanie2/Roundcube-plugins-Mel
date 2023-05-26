import { BaseModule } from "../../../js/lib/module";

const MODULE_ID = 'Headlines';
export class ModuleNew extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();
        this._add_listeners();
    }

    _add_listeners() {
        const KEY = `${MODULE_ID}_on_refresh`;
        this.on_frame_refresh(() => {
            this._on_refresh();
        }, 'bureau', {callback_key:KEY});
    }

    end() {
        this.set_title_action('news').select_headlines_by().css('display', 'none');
    }

    select_headlines_by() {
        return this.select_module().find('.headlines-by');
    }

    select_headline_title() {
        return this.select_module().find('.headlines-title');
    }

    select_headline_date() {
        return this.select_module().find('.headlines-publish');
    }

    select_headline_contents() {
        return this.select_module().find('.headlines-contents');
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }

    _on_refresh() {
        this.http_internal_get({
            task:'bureau',
            action:'get_last_new',
            on_success:(datas) => {
                datas = JSON.parse(datas);

                this._on_get_last_new_success(datas);
            }
        });
    }

    _on_get_last_new_success(datas) {
        this.select_module_title().text(`Information ${datas.service}`);
        this.select_headline_date().text(this._get_date(datas.date));
        this.select_headline_contents().html(datas.text.replaceAll('<script>', '<script_not_allowed>').replaceAll('</script>', '</script_not_allowed>'));
        
        return this;
    } 

    _get_date(date) {
        let published_or_modified = 'Publié';

        if (date.published !== date.modified) {
            published_or_modified = 'Modifié';
            date = date.modified;
        }
        else date = date.published;

        return `${published_or_modified} le ${ModuleNew.GetDateFr(moment(date).format('dddd DD MMMM YYYY'))}`;
    }

    static GetDateFr(date)
    {
        const capitalize = (s) => {
            if (typeof s !== 'string') return ''
            s = s.toLowerCase();
            return s.charAt(0).toUpperCase() + s.slice(1)
          }
        const arrayTransform = {
            "MONDAY":"LUNDI",
            "TUESDAY":"MARDI",
            "WEDNESDAY":"MERCREDI",
            "THURSDAY":"JEUDI",
            "FRIDAY":"VENDREDI",
            "SATURDAY":"SAMEDI",
            "SUNDAY":"DIMANCHE",
            "JANUARY":"JANVIER",
            "FEBRUARY":"FÉVRIER",
            "MARCH":"MARS",
            "APRIL":"AVRIL",
            "MAY":"MAI",
            "JUNE":"JUIN",
            "JULY":"JUILLET",
            "AUGUST":"AOÛT",
            "SEPTEMBER":"SEPTEMBRE",
            "OCTOBER":"OCTOBRE",
            "NOVEMBER":"NOVEMBRE",
            "DECEMBER":"DECEMBRE"
        }
        date = date.toUpperCase();
        for (const key in arrayTransform) {
            if (Object.hasOwnProperty.call(arrayTransform, key)) {
                const element = arrayTransform[key];
                if (date.includes(key))
                    date = date.replace(key, element);
            }
        }
        return capitalize(date);
    }
}