$(document).ready(() => {
    const EMPTY_STRING = '';

    if ('mail' === rcmail.env.task && [EMPTY_STRING, 'index'].includes(rcmail.env.action)) {
        let filters = [];

        class mel_filter {
            constructor($item, action, {enabled = false, default_filter = false, can_be_multiple = false, custom_action = null}) {
                this._init()._setup($item, action, enabled, default_filter, can_be_multiple, custom_action)._start();
            }

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

            _setup($item, action, enabled, default_filter, can_be_multiple, custom_action) {
                this.$item = $item;
                this.action = action;
                this.starting_enabled = enabled;
                this.default_filter = default_filter;
                this.can_be_multiple = can_be_multiple;
                this.custom_action = custom_action;

                return this;
            }

            _start() {
                let callback;

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
                else {
                    callback = (e) => this.click_callback(e);
                }

                this._callback = callback;

                this.$item.click((e) => {
                    if (!rcmail.busy) { 
                        this._callback(e);
                    }
                }); 
                callback = null;

                if (this.starting_enabled) this.enable();
            }

            click_callback(e) {
                rcmail.triggerEvent('quick-filter.brefore', {filter: this, target_event:e});

                if (!this.can_be_multiple) mel_filter.disable_all_quick_filters();
                else mel_filter.disable_quick_filter(mel_filter.get_default_filter());

                const plugin = rcmail.triggerEvent('quick-filter.action', {filter: this, target_event:e});

                if (!plugin?.abort) {

                    this.toggle();

                    if (0 !== [...mel_filter.get_filters_enabled()].length) {
                        let search = EMPTY_STRING;

                        for (const iterator of mel_filter.get_filters_enabled()) {
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

                        mel_filter.disable_button_from_all_filters();

                        $(rcmail.gui_objects.search_filter).val(search);

                        if (this.action === 'ALL')
                        {
                            mel_filter.reset_labels();
                            mel_filter.reset_priorities();
                            rcmail.command('reset-search');
                            mel_filter.enable_button_from_all_filters();
                        }
                        else rcmail.command('search');


                    }
                    else 
                    {
                        if (0 === [...mel_filter.get_filters_enabled()].length) {
                            mel_filter.enable_quick_filter(mel_filter.get_default_filter());
                            mel_filter.reset_labels();
                            mel_filter.reset_priorities();
                            rcmail.command('reset-search');
                            mel_filter.enable_button_from_all_filters();
                        }
                    }

                }
            }

            is_enabled() {
                return this.$item.is('.active');
            }

            enable() {
                return mel_filter.enable_quick_filter(this.$item);
            }

            disable() {
                return mel_filter.disable_quick_filter(this.$item);
            }

            toggle() {
                return this.is_enabled() ? this.disable() : this.enable();
            }

            static filter_class() {
                return 'quick-filter';
            }

            static disable_all_quick_filters() {
                return $(`.${this.filter_class()}`).removeClass('active');
            }

            static enable_quick_filter($item) {
                return $($item).addClass('active');
            }

            static disable_quick_filter($item) {
                return $($item).removeClass('active');
            }

            static get_all_quick_filters_from_class() {
                return $(`.${this.filter_class()}`);
            }

            static get_default_filter() {
                if (!this.get_default_filter.filter) {
                    let tmp = filters.filter((f) => [1, true].includes(f.default_filter));

                    if (tmp.length > 0) this.get_default_filter.filter = tmp[0].$item;
                }

                return this.get_default_filter.filter;
            }

            static * get_filters_enabled() {
                for (let index = 0, len = filters.length; index < len; ++index) {
                    const element = filters[index];
                    
                    if (element.is_enabled()) yield element;
                }
            }

            static disable_button_from_all_filters() {
                for (let index = 0, len = filters.length; index < len; ++index) {
                    const element = filters[index];
                    
                    element.$item.attr('disabled', 'disabled').addClass('disabled');
                }
            }

            static enable_button_from_all_filters() {
                for (let index = 0, len = filters.length; index < len; ++index) {
                    const element = filters[index];
                    
                    element.$item.removeAttr('disabled').removeClass('disabled');
                }
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
                        class:`btn btn-secondary mel-button no-button-margin no-margin-button bckg true label_${$label.data('mel-label')} background important`
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
                        class:`btn btn-secondary mel-button no-button-margin no-margin-button active`
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
        }

        mel_filter.priority = (name, value) => {
            return {name, value};
        }

        for (const filter of mel_filter.get_all_quick_filters_from_class()) {
            const $filter = $(filter);
            filters.push(new mel_filter($filter, $filter.data('action'), {
                enabled: $filter.data('filter-start-enabled'), 
                default_filter: $filter.data('filter-default-filter'), 
                can_be_multiple: $filter.data('filter-can-be-multiple'),
                custom_action: $filter.data('filter-custom-action') || null
            }));
        }

        rcmail.addEventListener('responseaftersearch', function(args) {
            console.log('args', args);
            mel_filter.enable_button_from_all_filters();
        });

        rcmail.addEventListener('label.tooltip.click', (args) => {
            let {state, $target, $caller} = args;

            mel_filter.reset_labels();

            //TODO => get all labels from $target
            const labels = [...$target.parent().find('button')].filter((e) => $(e).hasClass('active')).map((e) => {
                mel_filter.show_label($(e));
                return 'KEYWORD '+$(e).data('value');
            });

            console.log('labels', labels);

            let filter = filters.filter((x) => x.$item.attr('id') === 'quick-filter-labels')[0];
            if (0 === labels.length) {
                $caller.addClass('active');//.mel_tooltip('hide');
            }
            else {
                filter.action = labels.join(' ');
                $caller.attr('data-action', filter.action).removeClass('active');//.mel_tooltip('hide');
            }

            $caller.mel_tooltip('hide');
            filter.click_callback($caller);
        });

        rcmail.addEventListener('quick-filter.priority', async (args) => {
            //debugger;
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

                        mel_filter.reset_priorities();

                        if ($target.hasClass('active')) $target.removeClass('active');
                        else $target.addClass('active');

                        const priorities = [...$('body .priority-tooltip button')].filter((e) => $(e).hasClass('active')).map(e => {
                            mel_filter.show_priority($(e));
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

                        filter.click_callback(e);
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
    }

    const rcmail_command_handler = rcmail.command_handler;
    rcmail.command_handler = function(command, ...args) {
        let return_value = rcmail_command_handler.call(this, command, ...args);

        let $check = $('#select-mail-state');

        switch (command) {
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
    // $('#toolbar-list-menu .selection').parent().remove();

});