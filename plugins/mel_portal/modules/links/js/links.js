import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import { Look } from '../../../../mel_metapage/js/lib/classes/metrics.js';
import { MelFor } from '../../../../mel_metapage/js/lib/helpers/loops.js';
import { MaterialSymbolHtml } from '../../../../mel_metapage/js/lib/html/html_icon.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { BaseModule } from '../../../js/lib/module.js';

const MODULE_ID = 'Links';
const ICONS_ANTI_NaN = {
  mail: 'e158',
  calendar: 'ebcc',
  chat: 'e0bf',
  workspace: 'e1a0',
  stockage: 'e2c8',
  addressbook: 'e7fd',
  useful_links: 'e157',
  sondage: 'e653',
  wekan: 'eb7f',
  news: 'ef42',
  rizomo: 'f19c',
  tasks: 'e834',
};

export class ModuleLinks extends BaseModule {
  constructor(load_module = true) {
    super(load_module);
  }

  start() {
    super.start();
    this.has_NaN = false;

    this.add_event_listener(
      'mel.portal.links.ongenerate.add',
      (args) => {
        return this.additionnal_links(args);
      },
      {},
    );

    let hook_datas = this.rcmail().triggerEvent(
      'mel.portal.links.generate.html',
      {
        break: false,
        module: this,
      },
    );

    if (!!hook_datas && hook_datas.break) return;

    hook_datas = this.trigger_event('mel.portal.links.generate.html', {
      break: false,
      module: this,
    });

    if (!!(hook_datas ?? true) && !hook_datas?.break) {
      this._generate_links();

      if (this.has_NaN) {
        const default_level = BnumLog.log_level;
        BnumLog.log_level = BnumLog.LogLevels.debug;
        let it = 0;
        const max = 10;
        const regenerate = () => {
          if (this.has_NaN !== false && it < max) {
            ++it;
            BnumLog.debug('regenerate', 'Tentative', it);
            this.has_NaN = false;
            this.select_module_content().html('');
            this._generate_links();
            if (this.has_NaN) {
              return setTimeout(() => {
                regenerate();
              }, 100);
            }
          } else if (this.has_NaN) {
            BnumLog.error('ModuleLinks/start', 'Les liens sont des NaN', this);
            BnumLog.warning(
              'ModuleLinks/start',
              'Les liens seront remplacer par des icônes par défaut, celles-ci peuvent différer des icônes de la barre de gauche.',
            );
            html_link.use_replace_on_NaN = true;
            it = -2;
            regenerate();
            html_link.use_replace_on_NaN = false;
            return;
          }

          BnumLog.log_level = default_level;
        };

        regenerate();
      }
    }
  }

  _generate_links() {
    const lines = 2;
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

    links =
      this.trigger_event('mel.portal.links.ongenerate.add', {
        links,
        module: this,
      })?.links ?? links;

    const settings = links
      .where((x) => x._current_task === 'settings')
      .firstOrDefault();

    if (settings) {
      links = links.where((x) => x._current_task !== 'settings').add(settings);
    }

    if (links.any()) {
      let html_lines = [];

      MelFor.Start(0, lines, (i, start, end) => {
        html_lines.push(
          new mel_html2('div', { attribs: { class: 'mv2-app-line' } }),
        );
      });

      links = links
        .where((x) => x._current_task !== 'last_frame')
        .orderBy((x) => x.order);
      const links_lenght = links.count();
      let it = 0;
      for (let iterator of links) {
        if (!iterator.onclick.haveEvents()) {
          iterator.onclick.push((e) => {
            let navigator = top ?? parent ?? window;

            if (navigator.mm_st_ClassContract) {
              let app = $(e.currentTarget).data('app');

              switch (app) {
                case 'chat':
                  app = 'discussion';
                  break;

                default:
                  break;
              }

              MelObject.Empty().change_frame(app, {
                force_update: false,
                update: false,
              });
              Look.SendTask(app);
            }
          });
        }
        html_lines[~~(it / (links_lenght / lines))].addContent(iterator);
        ++it;
      }

      MelFor.Start(
        0,
        html_lines.length,
        (i, start, end, $module, html_lines) => {
          html_lines[i].create($module);

          if (
            MelEnumerable.from(html_lines[i].jcontents).any((x) => x.has_nan)
          ) {
            this.has_NaN = true;
          }
        },
        this.select_module_content(),
        html_lines,
      );

      html_lines = null;
    }
  }

  additionnal_links(args) {
    let { links } = args;
    const count = links
      .where((x) => x.order !== Infinity)
      .select((x) => x.order)
      .max();
    let add_links = [
      {
        name: 'Visioconférence',
        class: 'visio',
        font: 'Material Symbols Outlined',
        content: 'e04b',
        click: () => {
          window.webconf_helper.go();
          Look.SendTask('webconf');
        },
      },
      {
        name: 'Notes',
        class: 'notes',
        font: 'Material Symbols Outlined',
        content: 'f1fc',
        click: () => {
          (top ?? parent ?? window).$('#button-notes').click();
          Look.SendTask('notes');
        },
      },
    ];

    if (
      !(
        !!this.get_env('plugin_list_visio') ||
        !!this.rcmail(true).env.plugin_list_visio
      )
    ) {
      add_links[0] = add_links[1];
      add_links.length = 1;
    }

    let html;
    for (let index = 0, len = add_links.length; index < len; ++index) {
      const element = add_links[index];
      if (links.where((x) => x._current_task === 'parapheur').firstOrDefault())
        continue;

      html = new html_link($());
      html._current_task = element.class;
      html._name = element.name;
      html.content = element.content;
      html.font = element.font;
      html.order = count + index;
      html.onclick.push(element.click);
      links = links.add(html);
    }

    args.links = links.where(
      (x) => !['bureau', 'settings'].includes(x._current_task),
    );
    return args;
  }

  module_id() {
    let id = super.module_id();

    if (id) id += `_${MODULE_ID}`;
    else id = MODULE_ID;

    return id;
  }
}

class html_link extends mel_html2 {
  constructor($item) {
    super('button', {});

    this._startup($item);

    if (BnumLog.log_level <= BnumLog.LogLevels.debug)
      BnumLog.debug(
        'html_link/constructor',
        `Création du lien ${this._name}`,
        this,
      );
  }

  _startup($item) {
    this._$item = $item;
    this._name = EMPTY_STRING;
    this._current_task = EMPTY_STRING;
    this.content = EMPTY_STRING;
    this.font = EMPTY_STRING;
    this.order = Infinity;
    this.has_nan = false;

    if (
      $item.parent().css('display') !== 'none' &&
      $item.css('display') !== 'none'
    ) {
      this.order = $item.data('order');
      this._name = $item.find('.inner')?.text?.() ?? EMPTY_STRING;

      if (EMPTY_STRING === this._name)
        this._name = $item.find('.button-inner')?.text?.() ?? EMPTY_STRING;

      this._current_task = $item.attr?.('href')?.split?.('task=');

      if (!!this._current_task && !!this._current_task[1]) {
        this._current_task = this._current_task[1].split('&')[0];
      } else this._current_task = EMPTY_STRING;
    }

    return this;
  }

  _before_generate() {
    const css_key = `${this._current_task}_app`;
    if (!this.hasClass('mv2-app')) this.addClass('mv2-app');
    if (!this.hasClass(`${this._current_task}_app`))
      this.addClass(`${this._current_task}_app`);
    if (!this.hasClass(MaterialSymbolHtml.get_class_fill_on_hover()))
      this.addClass(MaterialSymbolHtml.get_class_fill_on_hover());

    this.attribs['data-app'] = this._current_task;

    if (EMPTY_STRING === this.content) {
      this.content = window
        .getComputedStyle(this._$item[0], ':before')
        .getPropertyValue('content')
        .replace(/"/g, '')
        .charCodeAt(0)
        .toString(16);
    }

    if (BnumLog.log_level <= BnumLog.LogLevels.debug) {
      BnumLog.debug('html_link/_before_generate', this.content, this._$item[0]);
    }

    if (!this.has_nan && this.content === 'NaN') this.has_nan = true;

    if (EMPTY_STRING === this.font) {
      this.font = window
        .getComputedStyle(this._$item[0], ':before')
        .getPropertyValue('font-family');
    }

    if (this.has_nan && html_link.use_replace_on_NaN) {
      this.content = ICONS_ANTI_NaN[this._current_task] ?? 'e7cc';
      this.font = 'Material Symbols Outlined';
      this.has_nan = false;
    }

    if (MEL_ELASTIC_UI.css_rules.ruleExist(css_key))
      MEL_ELASTIC_UI.css_rules.remove(css_key);

    MEL_ELASTIC_UI.css_rules.addAdvanced(
      css_key,
      `.mv2-app.${this._current_task}_app .mv2-app-icon:before`,
      `content:"\\${this.content}"`,
      `font-family:${this.font}`,
    );

    this.jcontents[0] = new mel_html('span', { class: 'mv2-app-icon' });
    this.jcontents[1] = new mel_html(
      'span',
      { class: 'mv2-app-text' },
      this._name,
    );
  }
}

html_link.use_replace_on_NaN = false;
