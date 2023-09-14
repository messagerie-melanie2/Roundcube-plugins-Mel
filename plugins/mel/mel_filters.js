$(document).ready(async () => {
    const EMPTY_STRING = '';

    if ('mail' === rcmail.env.task && [EMPTY_STRING, 'index'].includes(rcmail.env.action)) {
/** La classe `mel_filter` est une classe JavaScript qui représente un filtre et fournit des méthodes
pour gérer son état et son comportement. */
        class mel_filter {
            /**
             * Constructeur de la classe
             * @param {$} $item Item jquery qui représente le filtre
             * @param {string} action Action du filtre (ALL, etc...)
             * @param {Object} param2
             * @param {boolean} param2.enabled Indique si le filtre est activé ou non 
             * @param {boolean} param2.default_filter Indique si le filtre est le filtre par défaut
             * @param {boolean} param2.can_be_multiple Indique si le filtre peut être activé avec plusieurs autres filtres
             * @param {string|function} param2.custom_action Action personnalisée à exécuter lorsque le filtre est activé
             */
            constructor($item, action, {enabled = false, default_filter = false, can_be_multiple = false, custom_action = null}) {
                this._init()._setup($item, action, enabled, default_filter, can_be_multiple, custom_action)._start();
            }

            /**
             * Initialise les propriétés de la classe
             * @private
             * @returns Chaînage
             */
            _init() {
                this.$item = $();
                this.action = EMPTY_STRING;
                this.starting_enabled = false;
                this.default_filter = false;
                this.can_be_multiple = false;
                this.custom_action = null;
                this._callback = null;

                return this;
            }

            /**
             * Assigne les variables de la classe
             * @param {$} $item 
             * @param {string} action 
             * @param {boolean} enabled 
             * @param {boolean} default_filter 
             * @param {boolean} can_be_multiple 
             * @param {string|function} custom_action 
             * @returns Chaîne
             */
            _setup($item, action, enabled, default_filter, can_be_multiple, custom_action) {
                this.$item = $item;
                this.action = action;
                this.starting_enabled = enabled;
                this.default_filter = default_filter;
                this.can_be_multiple = can_be_multiple;
                this.custom_action = custom_action;

                return this;
            }

            /**
             * Initialise les fonctionnalités des membres de la classe
             */
            _start() {
                let callback;

                //Gestion des actions personnalisées
                if (!!this.custom_action) {
                    if ('string' === typeof this.custom_action){
                        callback = this.custom_action.split(':');

                        switch (callback[0]) {
                            case 'trigger':
                                callback = ((trigger_name) => {
                                    return (e) => {
                                        rcmail.triggerEvent(trigger_name, {filter: this, target_event:$(e.target)});
                                    };
                                })(callback[1]);
                                break;
                        
                            default:
                                break;
                        }
                    }
                    else callback = this.custom_action;
                }
                else callback = (e) => mel_filter_manager.base_callback(this, e, {});

                this._callback = callback;

                this.$item.click((e) => {
                    if (!rcmail.busy) { 
                        this._callback(e);
                    }
                }); 
                callback = null;

                if (this.starting_enabled) this.activate();
            }

/**
 * La fonction vérifie si l'élément est actif.
 * @returns {boolean}
 */
            is_active() {
                return this.$item.is('.active');
            }

            /**
             * Active visuellement le filtre
             * @returns Chaînage
             */
            activate() {
                this.$item.addClass('active');
                return this;
            }

            /**
             * Désactive visuellement le filtre
             * @returns Chaînage
             */
            deactivate() {
                this.$item.removeClass('active');
                return this;
            }

/**
 * La fonction vérifie si l'élément est activé ou non.
 * @returns {boolean}
 */
            is_enabled() {
                return !this.$item.is('.disabled');
            }

            /**
             * Désactive le filtre
             * @returns Chaînage
             */
            disable() {
                this.$item.attr('disabled', 'disabled').addClass('disabled');
                return this;
            }

            /**
             * Active le filtre
             * @returns Chaînage
             */
            enable() {
                this.$item.removeAttr('disabled').removeClass('disabled');
                return this;
            }

            /**
             * Active ou désactive le filtre
             * @returns Chaînage
             */
            toggle_active() {
                return this.is_active() ? this.deactivate() : this.activate();
            }

                        /**
             * Active ou désactive le filtre
             * @returns Chaînage
             */
            toggle() {
                return this.is_enabled() ? this.disable() : this.enable();
            }

/**
 * La fonction "filter_class" renvoie la chaîne "quick-filter".
 * @returns La chaîne « quick-filter » est renvoyée.
 */
            static filter_class() {
                return 'quick-filter';
            }

        }

/** Le code ci-dessus définit une fonction appelée « priorité » pour l'objet « mel_filter » en
JavaScript. Cette fonction prend deux paramètres, « nom » et « valeur », et renvoie un objet avec
les propriétés « nom » et « valeur ». 
* @param {string} name Nom de la priorité
* @param {string} value Valeur de la priorité
*/
        mel_filter.priority = (name, value) => {
            return {name, value};
        }

        class mel_selector {

            constructor($item) {
                this.$item = $item;
            }

            is_active() {
                return this.$item.is('.active');
            }

            activate() {
                this.$item.addClass('active');
                return this;
            }

            deactivate() {
                this.$item.removeClass('active');
                return this;
            }

            is_enabled() {
                return !this.$item.is('.disabled');
            }

            disable() {
                this.$item.attr('disabled', 'disabled').addClass('disabled');
                return this;
            }

            enable() {
                this.$item.removeAttr('disabled').removeClass('disabled');
                return this;
            }

            toggle_active() {
                return this.is_active() ? this.deactivate() : this.activate();
            }

            toggle() {
                return this.is_enabled() ? this.disable() : this.enable();
            }

            update_selected_check() {
                let $check = this.$item;
                let list = rcmail.message_list;
                if (0 === list.selection.length) $check.removeAttr('checked', 'checked')[0].checked = false;
                else $check.attr('checked', 'checked')[0].checked = true;
            }

            static get_checkbox() {
                return new mel_selector($('#select-mail-state'));
            }

            static get_button_list() {
                return new mel_selector($('#list-select-mail-choices'));
            }


        }

        class mel_filter_manager {
            constructor() {
                this.filters = [];

                this._create_filters();
            }

            _create_filters() {
                for (const filter of this.get_all_quick_filters_from_class()) {
                    const $filter = $(filter);
                    this.filters.push(new mel_filter($filter, $filter.data('action'), {
                        enabled: $filter.data('filter-start-enabled'), 
                        default_filter: $filter.data('filter-default-filter'), 
                        can_be_multiple: $filter.data('filter-can-be-multiple'),
                        custom_action: $filter.data('filter-custom-action') || null
                    }));
                }
            }

            deactivate_all_filters() {
                this._action_on_all_filter((f) => f.deactivate());
                return this;
            } 

            /**
             * La fonction `get_default_filter` renvoie le filtre par défaut à partir d'une liste de filtres.
             * @returns {mel_filter}
             */
            get_default_filter() {
                if (!this.get_default_filter.filter) {
                    let tmp = this.filters.filter((f) => [1, true].includes(f.default_filter));

                    if (tmp.length > 0) this.get_default_filter.filter = tmp[0];
                }

                return this.get_default_filter.filter;
            }

            get_all_quick_filters_from_class() {
                return $(`.${mel_filter.filter_class()}`);
            }

            * _set_action_on_all_filters(action, where = null) {
                for (let index = 0, len = this.filters.length; index < len; ++index) {
                    if (!where) yield action(this.filters[index]);
                    else if (where(this.filters[index])) yield action(this.filters[index]);
                }
            }

            _action_on_all_filter(action, where = null) {
                return [...this._set_action_on_all_filters(action, where)];
            }

            * get_filters_active() {
                yield * this._set_action_on_all_filters((f) => f, (f) => f.is_active());
            }

            get_filters_active_array() {
                return [...this.get_filters_active()];
            }

            disable_all() {
                mel_selector.get_checkbox().disable();
                mel_selector.get_button_list().disable();
                mel_filter_manager.disable_extra_buttons();
                this._action_on_all_filter((f) => f.disable());
                return this;
            }

            enable_all() {
                mel_selector.get_checkbox().enable();
                mel_selector.get_button_list().enable();
                mel_filter_manager.enable_extra_buttons();
                this._action_on_all_filter((f) => f.enable());
                return this;
            }

            static get_line_label() {
                let $line = $('#message-list-filters-extra .labels-list');

                if (0 === $line.length) {
                    $line = $('<div class="labels-list"></div>');
                    $('#message-list-filters-extra').append($line);
                }

                return $line;
            }

            static show_label($label) {
                let $line = this.get_line_label().show();

                new mel_html2('button', {
                    attribs:{
                        class:`btn btn-secondary mel-button no-button-margin no-margin-button bckg true label_${$label.data('mel-label')} background hoverable important`
                    },
                    contents:[
                        new mel_html('span', {class:''}, $label.text()),
                        new mel_html('span', {class:'material-symbols-outlined'}, 'close')
                    ]
                }).create($line).click((e) => {
                    $(e.currentTarget).remove();
                    $label.click();
                }).on('mouseover', (e) => {
                    $(e.currentTarget).removeClass(`label_${$label.data('mel-label')}`);
                }).on('mouseout', (e) => {
                    $(e.currentTarget).addClass(`label_${$label.data('mel-label')}`);
                });
            }

            static reset_labels() {
                this.get_line_label().html('').hide();
            }

            static reset_extra_states() {
                $('.mel-tooltip button').removeClass('active').removeClass('background').addClass('txt');
            }

            static get_line_priority() {
                if (0 === this.get_line_label().length) return;

                let $line = $('#message-list-filters-extra .prio-list');

                if (0 === $line.length) {
                    $line = $('<div class="prio-list"></div>');
                    $('#message-list-filters-extra').append($line);
                }

                return $line;
            }

            static show_priority($prio) {
                let $line = this.get_line_priority().show();

                new mel_html2('button', {
                    attribs:{
                        class:`btn btn-secondary mel-button no-button-margin no-margin-button active hoverable`
                    },
                    contents:[
                        new mel_html('span', {class:''}, $prio.text()),
                        new mel_html('span', {class:'material-symbols-outlined'}, 'close')
                    ]
                }).create($line).click((e) => {
                    $(e.currentTarget).remove();
                    $prio.click();
                });
            }

            static reset_priorities() {
                this.get_line_priority().html('').hide();
            }

            static disable_extra_buttons() {
                return $('#message-list-filters-extra button').attr('disabled', 'disabled').addClass('disabled');
            }

            static enable_extra_buttons() {
                return $('#message-list-filters-extra button').removeAttr('disabled').removeClass('disabled');
            }

            static _base_callback_reset_action(filter, event, on_reset) {
                mel_filter_manager.Instance.get_default_filter().activate();
                this.reset_labels();
                this.reset_priorities();
                this.reset_extra_states();
                $('#mailsearchlist .searchbar').removeClass('active');
                rcmail.command('reset-search');

                if (!!on_reset) on_reset(filter, event);
            }

            /**
             * 
             * @param {mel_filter} filter 
             * @param {*} event 
             * @param {*} param2 
             */
            static base_callback(filter, event, {
                before = null,
                after = null,
                on_reset = null
            }) {
                if (!!before) before(filter, event);

                rcmail.triggerEvent('quick-filter.brefore', {filter, target_event:event});

                if (!filter.can_be_multiple) mel_filter_manager.Instance.deactivate_all_filters(); //mel_filter.disable_all_quick_filters()
                else mel_filter_manager.Instance.get_default_filter().deactivate(); //mel_filter.disable_quick_filter(mel_filter.get_default_filter());

                const plugin = rcmail.triggerEvent('quick-filter.action', {filter, target_event:event});

                if (!plugin?.abort) {
                    filter.toggle_active();

                    mel_filter_manager.Instance.disable_all();
                    //mel_filter.disable_button_from_all_filters();

                    if (0 !== mel_filter_manager.Instance.get_filters_active_array().length) {
                        let search = EMPTY_STRING;

                        for (const iterator of mel_filter_manager.Instance.get_filters_active()) {
                            search += `${iterator.action} `;
                        }

                        search = search.slice(0, -1);
                            
                        if (0 === $(rcmail.gui_objects.search_filter).find('#custom-option').length)    
                        {
                            $(rcmail.gui_objects.search_filter).append(`<option id="custom-option" value="${search}">Custom</option>`);
                        }
                        else {
                            $(rcmail.gui_objects.search_filter).find('#custom-option').val(search);
                        }

                        $(rcmail.gui_objects.search_filter).val(search);

                        if (filter.action === 'ALL')
                        {
                            this._base_callback_reset_action(filter, event, on_reset);
                        }
                        else {
                            rcmail.command('search');
                        }
                    }
                    else 
                    {
                        this._base_callback_reset_action(filter, event, on_reset);
                    }

                    if (!!after) after(filter, event);

                }
            }
        }

        /**
         * @type {mel_filter_manager}
         */
        mel_filter_manager.Instance = null;

        Object.defineProperties(mel_filter_manager, {
            Instance: {
                get: function() {
                    if (!mel_filter_manager._instance) mel_filter_manager._instance = new mel_filter_manager();

                    return mel_filter_manager._instance;
                },
                configurable: true
            }
        });

        rcmail.addEventListener('responseaftersearch', function(args) {
            mel_filter_manager.Instance.enable_all();
            mel_selector.get_checkbox().update_selected_check();
        });

        rcmail.addEventListener('responseafterlist', function(args) {
            mel_filter_manager.Instance.enable_all();
            mel_filter_manager.Instance.deactivate_all_filters();
            mel_filter_manager.Instance.get_default_filter().activate();
            mel_filter_manager.reset_labels();
            mel_filter_manager.reset_priorities();
            mel_filter_manager.reset_extra_states();
            mel_selector.get_checkbox().update_selected_check();
        });

        rcmail.addEventListener('label.tooltip.click', (args) => {
            let {state, $target, $caller} = args;
            mel_filter_manager.reset_labels();

            //TODO => get all labels from $target
            const labels = [...$target.parent().find('button')].filter((e) => $(e).hasClass('active')).map((e) => {
                mel_filter_manager.show_label($(e));
                return 'KEYWORD '+$(e).data('value');
            });

            let filter = mel_filter_manager.Instance.filters.filter((x) => x.$item.attr('id') === 'quick-filter-labels')[0];
            if (0 === labels.length) {
                $caller.addClass('active');//.mel_tooltip('hide');
            }
            else {
                filter.action = labels.join(' ');
                $caller.attr('data-action', filter.action).removeClass('active');//.mel_tooltip('hide');
            }

            $caller.mel_tooltip('hide');
            mel_filter_manager.base_callback(filter, $caller, {});
        });

        rcmail.addEventListener('quick-filter.priority', async (args) => {
            let {filter, target_event} = args;

            let $tooltip = $('body .priority-tooltip');

            if (0 === $tooltip.length) {
                const priorities = [
                    mel_filter.priority('La plus élevée', 'HEADER X-PRIORITY 1'),
                    mel_filter.priority('Élevée', 'HEADER X-PRIORITY 2'),
                    mel_filter.priority('Normale', 'NOT HEADER X-PRIORITY 1 NOT HEADER X-PRIORITY 2 NOT HEADER X-PRIORITY 4 NOT HEADER X-PRIORITY 5'),
                    mel_filter.priority('Basse', 'HEADER X-PRIORITY 4'),
                    mel_filter.priority('La plus basse', 'HEADER X-PRIORITY 5')
                ];

                let html_div = new mel_html2('div', {attribs:{class:'priority-tooltip btn-group-vertical'}});

                let html_button;
                for (const iterator of priorities) {
                    html_button = new mel_html('button', 
                        {
                            class:'btn btn-secondary mel-button no-button-margin no-margin-button bckg true',
                            'data-value':iterator.value
                        }, iterator.name);

                    html_button.onclick.push((e) => {
                        let $target = $(e.target);

                        mel_filter_manager.reset_priorities();

                        if ($target.hasClass('active')) $target.removeClass('active');
                        else $target.addClass('active');

                        const priorities = [...$('body .priority-tooltip button')].filter((e) => $(e).hasClass('active')).map(e => {
                            mel_filter_manager.show_priority($(e));
                            return $(e).data('value');
                        });

                        if (priorities.length > 0) {
                            filter.$item.removeClass('active');
                            filter.action = priorities.join(' ');
                        }
                        else {
                            filter.$item.addClass('active');
                            filter.action = '';
                        }

                        target_event.mel_tooltip('hide');
                        mel_filter_manager.base_callback(filter, e, {});
                    });

                    html_div.addContent(html_button);
                    html_button = undefined;
                }

                window.loadJsModule = window.loadJsModule ?? (top ?? parent).loadJsModule;

                const mel_tooltip_js = await loadJsModule('mel_metapage', 'mel_tooltip.js', '/js/lib/classes/');

                target_event.mel_tooltip('init', {
                    content: html_div.generate(),
                    mode: mel_tooltip_js.enum_tooltip_mode.CLICK_AND_FOCUS
                });
            }

            target_event.mel_tooltip('toggle');
        });

        const rcmail_command_handler = rcmail.command_handler;
        rcmail.command_handler = function(command, ...args) {
            let return_value = rcmail_command_handler.call(this, command, ...args);
    
            let $check = $('#select-mail-state');
    
            switch (command) {
                case 'list':
                    mel_filter_manager.Instance.disable_all();
                    break;
                case 'select-all':
                    let list = this[this.task == 'addressbook' ? 'contact_list' : 'message_list'];
                    if (0 === list.selection.length) $check.removeAttr('checked', 'checked')[0].checked = false;
                    else $check.attr('checked', 'checked')[0].checked = true;
    
                    break;
            
                  case 'select-none':
                    $check.removeAttr('checked')[0].checked = false;
                    break;
            
                default:
                    break;
            }
    
            return return_value;
        }
    
        $('#select-mail-state').click((e) => {
            if (e.currentTarget.checked) rcmail.command('select-all');
            else rcmail.command('select-none');
        });
    
        $('#toolbar-list-menu .select').parent().remove();

        rcmail.addEventListener('init', () => {
            rcmail.message_list.addEventListener('select', () => {
                mel_selector.get_checkbox().update_selected_check();
            });
        });

        const { MelEnumerable } = await loadJsModule('mel_metapage', 'enum.js', '/js/lib/classes/');
        const corrector = 0;

        const observe = async () => {
            $('#message-list-filters li').show();
            $('#message-list-filters .filter-last-before-more').removeClass('filter-last-before-more');

            if (0 !== $('#message-list-filters li.mel-filter-more').length) {
                $('#message-list-filters li.mel-filter-more').hide();

                if ($('#message-list-filters li.mel-filter-more button').hasClass('activated')) {
                    $('#message-list-filters li.mel-filter-more button').click();
                }
            }

            const layout_list_width = $('#layout-list').width(); 
            const li_width = MelEnumerable.from($('#message-list-filters li')).sum({selector: (x) => $(x).width()});
            console.log('observe...', 'layout',layout_list_width, 'li', li_width);
            if (li_width > layout_list_width) {

                $('#message-list-filters').css('padding-right', 0);

                let width = 0;
                let $iterator;
                for (const iterator of $('#message-list-filters li')) {
                    $iterator = $(iterator);
                    width += $iterator.width() + corrector;

                    if (width > layout_list_width) {
                        $iterator.hide();
                        if (0 === $('#message-list-filters li.filter-last-before-more').length) {
                            $iterator.addClass('filter-last-before-more')
                        }
                    }
                }

                width = null;
                $iterator = null;

                if (0 === $('#message-list-filters li.mel-filter-more').length)
                {
                    let more_button = new mel_html2('button', {
                        attribs:{class:'mel-button no-button-margin no-margin-button mel-filter-more'},
                        contents: new mel_html('span', {class:'material-symbols-outlined'}, 'chevron_right')
                    });

                    more_button.onclick.push((e) => {
                        e = $(e.currentTarget);
                        if (!e.hasClass('activated')) {
                            $('#message-list-filters li').show();
                            e.addClass('activated').find('span').html('expand_more');
                            $('#message-list-filters').css({
                                'flex-wrap': 'wrap',
                            });
                            e.parent().css('margin-top', '-47px');
                        }
                        else {
                            e.removeClass('activated').find('span').html('chevron_right');
                            $('#message-list-filters').css({
                                'flex-wrap': '',
                                'justify-content': ''
                            });
                            e.parent().css('margin-top', '');
                            observe();
                        }
                    });

                    new mel_html2('li', {attribs:{class:'mel-filter-more'}, contents:more_button}).create($('#message-list-filters'));
                }

                $('#message-list-filters li.mel-filter-more').show();

                const visible_enum = MelEnumerable.from($('#message-list-filters li')).where(x => $(x).css('display') !== 'none');

                if (visible_enum.select(x => $(x).width() + ($(x).hasClass('mel-filter-more') ? 0 : corrector)).sum({}) > layout_list_width) {
                    $('#message-list-filters .filter-last-before-more').removeClass('filter-last-before-more');
                    let last = visible_enum.where(x => !$(x).hasClass('mel-filter-more')).last();//.hide();
                    console.log('last', visible_enum.toArray(), last, $(last).children());
                    if (!!last) $(last).addClass('filter-last-before-more').hide();
                }
            }
        };

        let timeout;
        let filter_observer = new ResizeObserver(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                observe();
                clearTimeout(timeout);
            }, 200);
        });

        filter_observer.observe($('#layout-list')[0]);

    }

});