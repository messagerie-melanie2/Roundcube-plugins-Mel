$(document).ready(() => {

    const original_search = rcmail.env.word_searched;
    const replaced = rcmail.env.REPLACED_SEARCH;

    //=======================================//
    // ** searchBlock **                     
    //=======================================//
    class searchBlock {
        constructor(type, data)
        {
            this.init().setup(type, data);
        }

        init() {
            this.raw = [];
            this.$block = $();
            this.type = '';
            return this;
        }

        setup(type, data) {
            this.type = type;
            this.raw = data;
            return this;
        }

        create()
        {
            this.$block = $(`<div data-type="${this.type}">${this.raw.html}</div>`);
            return this;
        }

        setParent($parent)
        {
            this.$block = this.$block.appendTo($parent);
            return this;
        }
    }

    //=======================================//
    // ** search **                     
    //=======================================//
    class search {
        constructor(word, config, otherConfigs = {})
        {
            this.init().setup(word, config);
        }

        init() {
            this.word = '';
            this.config = [];
            this.blocks = {};
            this._count = 0;
            this.settings = {
                $resultNumber:$('#search-result-number'),
                $searchWord:$('#mel-serach-word'),
                $searchInput:$('#wsp-search-input'),
                $globaSearchInput:top.$('#barup-search-input'),
                $body:$('.body .results'),
                buttons:{
                    $params:$('#mel-search-parameter-button')
                },
                selects:{
                    $filter:$('#search-filter'),
                    $filterBal:$('#search-filter-balp'),
                    $filterBaliFolder:$("#search-filter-folder"),
                    $order:$('#search-order')
                }
            };
            return this;
        }

        setup(word, config, then = null)
        {
            this.word = word;
            this.config = config;
            return this._search(word, config, then);
        }

        _launch_timeout(count)
        {   
            //debugger;
            this._count += count;
            if (this._text_timeout === undefined)
            {
                this._current_count = this._current_count ?? 0;
                this._text_timeout = setInterval(() => {
                    //debugger;
                    if (this._current_count > this._count)
                    {
                        clearInterval(this._text_timeout);
                        this._text_timeout = undefined;
                    }
                    else this.settings.$resultNumber.html(this._current_count++);
                }, 25);
            }
        }

        research(word, config)
        {
            for (const key in this.blocks) {
                if (Object.hasOwnProperty.call(this.blocks, key)) {
                    this.blocks[key].$block.remove();
                }
            }

            this.blocks = {};
            this._count = 0;
            this._current_count = 0;
            delete this._text_timeout;

            this.settings.$resultNumber.html(0);
            this.settings.$searchWord.html(`"${word}"`);
            this.settings.$globaSearchInput.val(word).addClass('disabled').attr("disabled", 'disabled');
            this.settings.$searchInput.val(word).addClass('disabled').attr("disabled", 'disabled');
            // this.settings.selects.$filter.addClass('disabled').attr("disabled", 'disabled');
            // this.settings.selects.$order.addClass('disabled').attr("disabled", 'disabled');
            // this.settings.sel
            for (const key in this.settings.selects) {
                if (Object.hasOwnProperty.call(this.settings.selects, key)) {
                    const element = this.settings.selects[key];
                    element.addClass('disabled').attr("disabled", 'disabled')
                }
            }

            for (const key in this.settings.buttons) {
                if (Object.hasOwnProperty.call(this.settings.buttons, key)) {
                    const element = this.settings.buttons[key];
                    element.addClass('disabled').attr("disabled", 'disabled')
                }
            }

            $('.body .loading').css('display', '').find('.spinner-grow').removeClass('text-success').removeClass('text-danger');
            $('.body .results').css('display', 'none');

            return this.setup(word, config, () => {this.order().filter();});
        }

        _search(word, config, then = null)
        {
            const settings = this.settings;
            let _this = this;
            let count = 0;
            let howManyFinished = 0;
            for (let index = 0; index < config.length; ++index) {
                const element = config[index];
               // mm_s_array.push({index:index,ajax:
                $.ajax({ // fonction permettant de faire de l'ajax
                type: "GET", // methode de transmission des données au fichier php
                url: element.replace(replaced, word), // url du fichier php
                dataType: 'json',
                success: function (data) {
                    try {        
                        if (Array.isArray(data) && data.length > 0 && data[0].calendar !== undefined)
                            data = SearchResultCalendar.from_array(data);
        
                        if (data.datas !== undefined && data.datas.length > 0)
                        {
                            // count += data.datas.length;
                            // settings.$resultNumber.html(count);
                            _this._launch_timeout(data.datas.length);
                            console.log('result',data, data.datas);
                            _this._addBlock(data.label, data.datas);

                            if (!$('.body .loading .spinner-grow').hasClass('text-danger'))
                            {
                                $('.body .loading .spinner-grow').addClass('text-success');
                            }

                        }
        
                    } catch (error) {
                        
                    }

                    if (++howManyFinished >= config.length)
                    {
                        _this._showDatas();

                        if (!!then) then();
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
         
                },
             });//});
        
            }
            return this;
        }

        _addBlock(label, datas)
        {
            for (let index = 0; index < datas.length; ++index) {
                const element = datas[index];
                
                this.blocks[`${label}/${index}`] = new searchBlock(label, element);
            }
        }

        _showDatas(then = null)
        {
            for (const key in this.blocks) {
                if (Object.hasOwnProperty.call(this.blocks, key)) {
                    this.blocks[key].create().setParent(this.settings.$body);
                    this.blocks[key].$block.data('id', key);
                }
            }

            if (this._text_timeout !== undefined)
            {
                setTimeout(() => {
                    if (this._text_timeout !== undefined)
                    {
                        clearInterval(this._text_timeout);
                        this.settings.$resultNumber.html(this._count);
                    }
                    delete this._current_count;
                    delete this._text_timeout;
                }, 1000);
            }
            else {
                delete this._current_count;
                delete this._text_timeout;
            }

            this.settings.$globaSearchInput.removeClass('disabled').removeAttr("disabled");
            $("#layout-content .disabled").removeClass('disabled').removeAttr("disabled");
            $('.body .loading').css("display", 'none');
            $('.body .results').css('display', '');
        }

        count() {
            return this._count ?? 0;
        }

        order() {
            let _enum = Enumerable.from(this.blocks);//.toJsonDictionnary(x => x.key, x => x.value);
            let order;

            if (this.settings.selects.$order.val() === 'asc') order = _enum.orderBy(x => moment(Enumerable.from(x.value.raw).where(w => w.key === 'datas').select(s => s.value.date).toArray()[0] || moment.max()));
            else order = _enum.orderByDescending(x => moment(Enumerable.from(x.value.raw).where(w => w.key === 'datas').select(s => s.value.date).toArray()[0] || moment().subtract(moment().year(), 'y')));

            const ordered = order.toJsonDictionnary(x => x.key, x => x.value);
            for (const key in ordered) {
                if (Object.hasOwnProperty.call(ordered, key)) {
                    this.blocks[key].$block.remove();
                    this.blocks[key].create().setParent(this.settings.$body);
                    this.blocks[key].$block.data('id', key);
                }
            }
            return this;
        }

        filter() {
            const filter = this.settings.selects.$filter.val();
            const filter_bal = this.settings.selects.$filterBal.val();
            const filter_folder = this.settings.selects.$filterBaliFolder.val();
            const mail = rcmail.gettext('mail', 'mel_metapage');
            const isMail = filter === mail;
            let count = 0;
            
            for (const key in this.blocks) {
                if (Object.hasOwnProperty.call(this.blocks, key)) {
                    const element = this.blocks[key];

                    if (this._filter_action(element, key, filter, filter_bal, filter_folder, isMail)) ++count;
                    // if (filter === 'all') element.$block.css('display', '')
                    // else {
                    //     if (!key.includes(filter)) element.$block.css('display', 'none');
                    //     else element.$block.css('display', '');
                    // }
                }
            }

            if (this._text_timeout === undefined)
            {
                /*if (filter === 'all') */this.settings.$resultNumber.html(count);
                //else this.settings.$resultNumber.html(Enumerable.from(this.blocks).where(x => x.key.includes(filter)).count());
            }
            else {
                let interval = setInterval(() => {
                    if (this._text_timeout === undefined)
                    {
                        clearInterval(interval);
                        /*if (filter === 'all')*/ this.settings.$resultNumber.html(count);
                        //else this.settings.$resultNumber.html(Enumerable.from(this.blocks).where(x => x.key.includes(filter)).count());
                    }
                }, 100);
            }

            switch (filter) {
                case mail:
                    $("#folder-balp").css('display', '');
                    switch (filter_bal) {
                        case 'bali':
                            $("#folder-filter").css('display', '');
                            break;
                    
                        default:
                            $("#folder-filter").css('display', 'none');
                            break;
                    }
                    break;
            
                default:
                    $("#folder-filter").css('display', 'none');
                    $("#folder-balp").css('display', 'none');
                    break;
            }

            return this;
        }

        _filter_action(element, key, filter, filter_bal, filter_bali_folder, isMail, include = true)
        {
            let showed = false;

            //Pas de recherche
            if (filter === 'all') 
            {
                element.$block.css('display', '');
                showed = true;
            }
            else //Recherche spécifique
            {
                if (isMail && filter_bal !== 'all') { //Recherche sur la bali ou les balp
                    if (filter_bal === 'bali') { //Recherche sur la bali
                        if (filter_bali_folder === 'all') showed = this._filter_action(element, key, `${rcmail.gettext('mail', 'mel_metapage')}/INBOX`, 'all', 'all', false, true);
                        else { //Recherche sur une dossier de la bali
                            if (key.includes(`${rcmail.gettext('mail', 'mel_metapage')}/INBOX`) && element.raw.datas.folder === filter_bali_folder) 
                            {
                                element.$block.css('display', '');
                                showed = true;
                            }
                            else element.$block.css('display', 'none');
                        }
                    }
                    //Recherche sur une balp
                    else showed = this._filter_action(element, key, `${rcmail.gettext('mail', 'mel_metapage')}/Boite partag&AOk-e/${filter_bal.split('.-.')[1]}`, 'all', 'all', false, true);
                }
                //Recherche tout les mails + autres
                else if ((include ? !key.includes(filter) : key !== filter)) element.$block.css('display', 'none');
                else 
                {
                    element.$block.css('display', '');
                    showed = true;
                }
            }

            return showed;
        }

        openParams() {

            const paramUrl = 'https://roundcube.ida.melanie2.i2/?_task=settings&_action=edit-prefs&_section=globalsearch&_framed=1';

            let modal;

            let $html = $(`<iframe style='width:100%;min-height:300px' src=${paramUrl}></iframe>`).on('load', (e) => {
                $('#search-param-loading').css('display', 'none');
                console.log(e, 'e');
                e = $(e.currentTarget);      
                e[0].contentWindow.$('.formbuttons button').css('display', 'none');
                if (rcmail.env.params_updated === true)
                {
                    delete rcmail.env.params_updated;
                    this.settings.$globaSearchInput.addClass('disabled').attr("disabled", 'disabled');
                    modal.close();
                    rcmail.set_busy(true, 'loading');
                    window.location.href = window.location.href.replace(original_search, this.settings.$searchInput.val());
                }        
            });

            $html = $(`<div><center id=search-param-loading><span class='spinner-grow'></span></center></div>`).append($html);

            const config = new GlobalModalConfig('Paramètres de la recherche', 'default', $html);
            modal = new GlobalModal('globalModal', config);
            modal.footer.buttons.save.click(() => {
                rcmail.env.params_updated = true;
                modal.contents.find('iframe')[0].contentWindow.$('.formbuttons button').click();
            });
            modal.show();
            console.log('modal', modal);
        }
    }

    if (Enumerable.from(rcmail.env.mm_search_config).where(x => x.includes('search_mail')).any())
    {
        const base = Enumerable.from(rcmail.env.mm_search_config).where(x => x.includes('search_mail')).first();
        for (const key in rcmail.env.shared_mailboxes) {
            if (Object.hasOwnProperty.call(rcmail.env.shared_mailboxes, key)) {
                const element = rcmail.env.shared_mailboxes[key];
                rcmail.env.mm_search_config.push(`${base}&_mbox=${encodeURIComponent(`Boite partag&AOk-e/${key.split('.-.')[1]}`)}`);
            }
        }
    }

    search.search = new search(rcmail.env.word_searched, rcmail.env.mm_search_config);

    search.search.settings.selects.$order.on('change', () => {
        search.search.order().filter();
    });

    search.search.settings.selects.$filter.on('change', () => {
        search.search.filter();
    });

    search.search.settings.selects.$filterBal.on('change', () => {
        search.search.filter();
    });

    search.search.settings.selects.$filterBaliFolder.on('change', () => {
        search.search.filter();
    });

    search.search.settings.$searchInput.on('change', () => {
        rcmail.command('mel.search', {word:search.search.settings.$searchInput.val()});
    });

    search.search.settings.buttons.$params.click(() => {
        search.search.openParams()
    })

    rcmail.register_command('mel.search', (datas) => {
        const word = datas?.word ?? search.search.word;
        const config = datas.config ?? search.search.config;

        search.search.research(word, config);
    }, true);

    top._current_search = search.search;
});