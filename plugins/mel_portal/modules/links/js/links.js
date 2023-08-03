import { MelEnumerable } from "../../../../mel_metapage/js/lib/classes/enum.js";
import { MaterialSymbolHtml } from "../../../../mel_metapage/js/lib/html/html_icon.js";
import { MelObject } from "../../../../mel_metapage/js/lib/mel_object.js";
import { BaseModule } from "../../../js/lib/module.js";

const MODULE_ID = 'Links';
export class ModuleLinks extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();

        this.add_event_listener('mel.portal.links.ongenerate.add', (args) => {
            return this.additionnal_links(args);
        }, {});
        const hook_datas = this.trigger_event('mel.portal.links.generate.html', {break:false, module:this});

        if (!!(hook_datas ?? true) && !hook_datas?.break) {
            this._generate_links();
        }
    }

    _generate_links() {
        let _$ = (top ?? parent ?? window).$;

        let $apps = _$('#taskmenu li a');
        let $other_apps = _$('#otherapps li a');

        let links = [];
        for (const iterator of $apps) {
            links.push(new html_link($(iterator)));
        }

        for (const iterator of $other_apps) {
            links.push(new html_link($(iterator)));
        }

        links = links.filter((x) => {
            return x._current_task !== EMPTY_STRING;
        });

        
        links = MelEnumerable.from(links);

        links = this.trigger_event('mel.portal.links.ongenerate.add', {links, module:this})?.links ?? links;

        const settings = links.where(x => 'settings' === x._current_task).firstOrDefault();

        if (!!settings) {
            links = links.where(x => 'settings' !== x._current_task).add(settings);
        }

        if (links.any()) {
            for (let iterator of links.orderBy(x => x.order)) {
                if ('last_frame' === iterator._current_task) continue;
                if (!iterator.onclick.haveEvents())
                {
                    iterator.onclick.push((e) => {
                        let navigator = (top ?? parent ?? window);
    
                        if (!!navigator.mm_st_ClassContract) {
                            let app = $(e.currentTarget).data('app');
    
                            switch (app) {
                                case 'chat':
                                    app = 'discussion';
                                    break;
                            
                                default:
                                    break;
                            }
    
                            MelObject.Empty().change_frame(app, {force_update:false});
                        }
                    });
                }
                iterator.create(this.select_module_content());
            }
        }
    }

    additionnal_links(args) {
        let {links} = args;
        const count = links.count();
        const add_links = [
         {name:'Visioconférence', class:'visio', font:'Material Symbols Outlined', content:'e04b', click:() => {
            window.webconf_helper.go();
         }},
         {name:'Notes', class:'notes', font:'Material Symbols Outlined', content:'f1fc', click:() =>{
            (top ?? parent ?? window).$('#button-notes').click();
         }}];

        let html;
        for (let index = 0, len = add_links.length; index < len; ++index) {
            const element = add_links[index];
            html = new html_link($());
            html._current_task = element.class;
            html._name = element.name;
            html.content = element.content;
            html.font = element.font;
            html.order = count + index;
            html.onclick.push(element.click);
            links = links.add(html);
        }

        args.links = links.where(x => !['bureau', 'settings'].includes(x._current_task));
        return args;
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}

class html_link extends mel_html2 {
    constructor($item) {
        super('button', {});

        this._startup($item);
    }

    _startup($item) {
        this._$item = $item;
        this._name = EMPTY_STRING;
        this._current_task = EMPTY_STRING;
        this.content = EMPTY_STRING;
        this.font = EMPTY_STRING;
        this.order = Infinity;

        if ($item.parent().css('display') !== 'none' && $item.css('display') !== 'none')
        {
            this.order = $item.data('order');
            this._name = $item.find('.inner')?.text?.() ?? EMPTY_STRING;

            if (EMPTY_STRING === this._name) this._name = $item.find('.button-inner')?.text?.() ?? EMPTY_STRING;

            this._current_task = $item.attr?.('href')?.split?.('task=');

            if (!!this._current_task && !!this._current_task[1]) {
                this._current_task = this._current_task[1].split('&')[0];
            }
            else this._current_task = EMPTY_STRING;
        }

        return this;
    }

    _before_generate() {
        const css_key = `${this._current_task}_app`;
        if (!this.hasClass('mv2-app')) this.addClass('mv2-app');
        if (!this.hasClass(`${this._current_task}_app`)) this.addClass(`${this._current_task}_app`);
        if (!this.hasClass(MaterialSymbolHtml.get_class_fill_on_hover())) this.addClass(MaterialSymbolHtml.get_class_fill_on_hover());

        this.attribs['data-app'] = this._current_task;

        if (EMPTY_STRING === this.content) {
            this.content = window.getComputedStyle(
                this._$item[0], ':before'
            ).getPropertyValue('content').replace(/"/g, '').charCodeAt(0).toString(16);
        }

        if (EMPTY_STRING === this.font) {
            this.font =    window.getComputedStyle(
                this._$item[0], ':before'
            ).getPropertyValue('font-family');
        }

        if (MEL_ELASTIC_UI.css_rules.ruleExist(css_key)) MEL_ELASTIC_UI.css_rules.remove(css_key);

        MEL_ELASTIC_UI.css_rules.addAdvanced(css_key, `.mv2-app.${this._current_task}_app .mv2-app-icon:before`, 
        `content:"\\${this.content}"`,
        `font-family:${this.font}`);

        
        this.jcontents[0] = new mel_html('span', {class:'mv2-app-icon'});
        this.jcontents[1] = new mel_html('span', {class:'mv2-app-text'}, this._name);
    }
}