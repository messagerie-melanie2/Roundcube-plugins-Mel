$(document).ready(() => {

    try {
        Enumerable.from([]);
    } catch (error) {
        window.Enumerable = null;
    }

    /**
     * Classe qui gère une règle css. Elle pourra être ajouter ou supprimer.
     */
    class Mel_CSS_Rule {
        /**
         * 
         * @param {string} rule Règle css style "p{color:red;}"
         */
        constructor(rule)
        {
            this.rule = rule;
            this.id = null;
        }

        /**
         * Intègre le style à la page web
         * @returns {Mel_CSS_Rule} Chaînage
         */
        set()
        {
            this.id = Mel_CSS_Rule.component().insertRule(rule, Mel_CSS_Rule.lastIndex());
            return this;
        }

        /**
         * Supprime le style de la page web
         * @returns {Mel_CSS_Rule} Chaînage
         */
        delete()
        {
            Mel_CSS_Rule.component().deleteRule(this.id);
            this.id = null;
            return this;
        }

        /**
         * Retourne la règle css sous forme de string
         * @returns {string}
         */
        toString()
        {
            return this.rule;
        }

        /**
         * Récupère la première feuille de style du document
         * @returns {StyleSheetList}
         */
        static component()
        {
            return document.styleSheets[0];
        }

        /**
         * Récupère le prochain index de la feuille de style
         * @returns {number}
         */
        static lastIndex()
        {
            return Mel_CSS_Rule.component().cssRules.length
        }
    }

    /**
     * Classe qui gère une règle css. Elle pourra être ajouter ou supprimer.
     * Gère un sélécteur ainsi qu'une liste de modificateur css.
     */
    class Mel_CSS_Advanced_Rule extends Mel_CSS_Rule{
        /**
         * 
         * @param {string} selector Selector html (exemple: p.maclass)
         * @param  {...string} rules Liste de règles html (exemple : color:red) sans les ';'
         */
        constructor(selector, ...rules)
        {
            super(rules),
            this.selector = selector;
        }

        /**
         * Intègre le style à la page web
         * @returns {Mel_CSS_Advanced_Rule} Chaînage
         */
        set()
        {
            this.id = Mel_CSS_Rule.component().insertRule(this.toString(), Mel_CSS_Rule.lastIndex());
            return this;
        }

        /**
         * Ajoute une règle à la liste des règles
         * @param {string} rule Règle à ajouté (sans les ;)
         * @param {boolean} force_set Si vrai, met à jour la règle dans la page web
         * @returns Chaînage
         */
        add(rule, force_set = true)
        {
            this.rule.push(rule);
            return this._update_rule(force_set);
        }

        _update_rule(force_set = true)
        {
            if (!!this.id)
            {
                this.delete();

                if (force_set) this.set();
            }

            return this;
        }

        /**
         * Supprime une règle
         * @param {number} index Index de la règle à supprimer 
         * @param {boolean} force_set Si vrai, met à jour la règle dans la page web
         * @returns Chaînage
         */
        remove(index, force_set = true)
        {
            this.rule.splice(index, 1);
            return this._update_rule(force_set);
        }

        /**
         * Met à jour une règle
         * @param {number} index Index de la règle à modifier
         * @param {string} new_rule Nouvelle règle
         * @param {boolean} force_set Si vrai, met à jour la règle dans la page web
         * @returns Chaînage
         */
        update(index, new_rule, force_set = true)
        {
            this.rule[index] = new_rule;
            return this._update_rule(force_set); 
        }

        /**
         * Récupère les règles
         * @returns {string} Règles
         */
        rules()
        {
            return this.rule;
        }

        /**
         * Retourne la règle css sous forme de string
         * @returns {string}
         */
        toString()
        {
            return `${this.selector}{${this.rule.join(';\r\n')}}`;
        }
    }

    /**
     * Gère les différentes règles qu'on ajoute à cette classe.
     */
    class Mel_CSS_Style_Sheet {
        constructor()
        {
            this.css = {};
        }

        /**
         * Ajoute une règle à la liste de règles
         * @param {string} key Clé qui permettra de récupérer la règle ajouté
         * @param {Mel_CSS_Rule} rule Règle qui sera ajouté
         * @returns {Mel_CSS_Style_Sheet} Chaînage
         */
        _add(key, rule)
        {
            if (!this.ruleExist()) this.css[key] = rule.set();
            else {
                throw Mel_CSS_Style_Sheet.exception(`###[Mel_CSS_Style_Sheet] ${key} existe déjà !`);
            }
            return this;
        }

        /**
         * Ajoute une règle à la liste de règle
         * @param {string} key Clé qui permettra de récupérer la règle ajouté
         * @param {string} rule Règle qui sera ajouté (ex : p{color:red;}) 
         * @returns Chaînage
         */
        add(key, rule)
        {
            return this._add(key, new Mel_CSS_Rule(rule));
        }

        /**
         * Ajoute une règle à la liste des règles.
         * @param {string} key  Clé qui permettra de récupérer la règle ajouté
         * @param {string} selector Sélécteur html
         * @param  {...any} rules Liste de règles (ex : 'color:red', 'background-color:blue')
         * @returns Chaînage
         */
        addAdvanced(key, selector, ...rules)
        {
            return this._add(key, new Mel_CSS_Advanced_Rule(selector, ...rules));
        }

        /**
         * Ajoute plusieurs règles
         * @param  {...{key:string, rule:string}} rules Règles à ajouter
         * @returns Chaînage
         */
        addRules(...rules)
        {
            for (const key in rules) {
                if (Object.hasOwnProperty.call(rules, key)) {
                    const element = rules[key];
                    this.add(element.key, element.rule);
                }
            }

            return this;
        }

        /**
         * Supprime une règle
         * @param {string} key 
         * @returns Chaînage
         */
        remove(key)
        {
            if (this.ruleExist(key))
            {
                this.css[key].delete();
                delete this.css[key];
            }
            
            return this;
        }

        removeRules(...keys)
        {
            for (const key in keys) {
                if (Object.hasOwnProperty.call(keys, key)) {
                    const element = keys[key];
                    this.remove(element);
                }
            }

            return this;
        }

        /**
         * Vérifie si une règle éxiste
         * @param {string} key 
         * @returns 
         */
        ruleExist(key)
        {
            return !!this.css[key];
        }

        /**
         * Récupère les clés de la classe
         * @returns {string[]}
         */
        getKeys()
        {
            return Enumerable?.from(this.css)?.select(x => x.key)?.toArray() ?? [];
        }

        /**
         * Récupère la feuille de styme
         * @returns {string}
         */
        getStyleSheet()
        {
            return Enumerable?.from(this.css)?.select(x => x.value)?.toArray()?.join('\r\n') ?? '';
        }

        /**
         * Remise à zéro de la feuille de style
         * @returns Chaînage
         */
        reset()
        {
            for (const key in this.css) {
                if (Object.hasOwnProperty.call(this.css, key)) {
                    const element = this.css[key];
                    element.delete();
                }
            }

            this.css = {};
            return this;
        }

        static exception(message, ...datas)
        {
            return {
                message,
                datas
            };
        }

    }

    /**
     * Classe qui sert à gérer les différentes interfaces
     */
    class Mel_Elastic {
        constructor() {
            this.init()
            .setup()
            .update();
        }

        ////////////************* Inits and setups functions *************///////////

        /**
         * Initialise les différentes variables et constantes de la classe.
         * @returns {Mel_Elastic} Chaînage
         */
        init(){
            this.screen_type = null;
            this.css_rules = new Mel_CSS_Style_Sheet(); 
            return this.init_const().init_theme().initResponsive();
        }

        /**
         * Initialise les différentes constantes de la classe.
         * @returns {Mel_Elastic} Chaînage
         */
        init_const()
        {
            Object.defineProperty(this, 'JSON_CHAR_REPLACE', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: '¤¤¤'
              });

              Object.defineProperty(this, 'SELECT_VALUE_REPLACE', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: '<value/>'
              });

              Object.defineProperty(this, '_integer', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: 8
              });

              Object.defineProperty(this, 'IS_EXTERNE', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: window.location.href.includes("_extwin")
              });

              Object.defineProperty(this, 'FROM_INFOS', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {
                    key:"_is_from",
                    value:"iframe"
                }
              });

              
              Object.defineProperty(this, 'keys', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {
                    end: 35,
                    home: 36,
                    left: 37,
                    up: 38,
                    right: 39,
                    down: 40,
                    delete: 46
                  }
              });

              return this;
        }

        init_theme()
        {
            let tlength = 0;
            let html = '';
            this.theme = rcmail.env.current_theme || 'default';

            if (!!rcmail.env.current_theme) $('html').addClass(`theme-${rcmail.env.current_theme.toLowerCase()}`);

            if (!!rcmail.env.mel_themes) {
                const themes = rcmail.env.mel_themes;
                rcmail.env.mel_themes = null;

                this.themes = themes;

                for (const key in this.themes) {
                    if (Object.hasOwnProperty.call(this.themes, key)) {
                        ++tlength;
                        this.themes[key].css_path = 'unavailable';
                        this.themes[key].path = 'unavailable';

                        html += `
                        <div class="row mel-selectable ${this.themes[key].name === this.theme ? 'selected' : ''}" data-name="${this.themes[key].name}" role="button" aria-pressed="${this.themes[key].name === this.theme ? 'true' : 'false'}" style="margin-bottom:5px;margin-left:2px;">
                            <div class="col-4">
                                <img src="${this.themes[key].picture}" style="width:100%;" />
                            </div>
                            <div class="col-8" style="display:flex;">
                                <span style="display: block;
                                align-self: center;">${(this.themes[key].name === 'default' ? 'Par défaut' : this.themes[key].name)}</span>
                            </div>
                        </div>
                        `;
                    }
                }
            }

            let $theme_button = $('#theme-switch-button');
            if (top === window && $theme_button.length > 0)
            {
                if (tlength > 1)
                {
                    $theme_button.click(($e) => {
                        $e = $($e.currentTarget);

                        if (!$e.hasClass('activated'))
                        {
                            $e.addClass('activated').find('.icon-mel-painting').removeClass('icon-mel-painting').addClass('icon-mel-undo');
                            $('#notifications-panel').css('display', 'none');
                            $('#theme-panel').css('display', '');
                        }
                        else {
                            $e.removeClass('activated').find('.icon-mel-undo').addClass('icon-mel-painting').removeClass('icon-mel-undo');
                            $('#notifications-panel').css('display', '');
                            $('#theme-panel').css('display', 'none');
                        }
                    });

                    $('#theme-panel .contents').html(html).find('.mel-selectable').click((e) => {
                        e = $(e.currentTarget);
                        $('#theme-panel .contents .mel-selectable').removeClass('selected');
                        e.addClass('selected');

                        this.update_theme(e.data('name'));
                        mel_metapage.Functions.post(
                            mel_metapage.Functions.url('mel_metapage', 'plugin.update_theme'),
                            {_t:e.data('name')},
                            (f) => {},
                        );

                        this._update_theme_color();
                    });

                }
                else {
                    $theme_button.addClass('disabled').attr('disabled', 'disabled');
                }
            }

            return this._update_theme_color();
        }

        /**
         * Différentes actions à faire après l'initialisation.
         * @returns {Mel_Elastic} Chaînage
         */
        setup(){

            if (rcmail === undefined) return this;

            return this
            .setup_html()
            .setup_nav()
            .setup_tasks()
            .setup_search()
            .setup_other_apps()
            .setup_calendar();
        }

        /**
         * Met en place l'apparence et le fonctionnel de la barre de navigation principale
         * @returns {Mel_Elastic} Chaînage
         */
        setup_nav()
        {
            if (parent === window)
            {
                //La sidebar étant en position absolue, on décale certaines divs pour que l'affichage soit correct.
                const width = "60px";

                if (!this.IS_EXTERNE && $("#layout-sidebar").length > 0)
                    $("#layout-sidebar").css("margin-left", width);
                else if (!this.IS_EXTERNE && $("#layout-content").length > 0)
                    $("#layout-content").css("margin-left", width);
            }

            if ($("#taskmenu").length > 0)
            {
                //On met dans l'ordre les différents boutons de la barre de navigation principale
                let array = [];

                $("#taskmenu").find("a").each((i,e) => {
                e = $(e);

                if (e.parent().hasClass("special-buttons"))
                    return;

                const order = e.css("order");
                const tmp = e.removeAttr("title")[0].outerHTML;
                e.remove();
                e = null;
                array.push({
                    order:order,
                    item:$(tmp).keypress((event) => {

                        if (event.originalEvent.keyCode === 32)
                            $(event.currentTarget).click();

                    })
                });

                });

                $("#taskmenu").append('<ul class="list-unstyled"></ul>');

                Enumerable?.from(array)?.orderBy(x => parseInt(x.order))?.forEach((e) => {
                    let li = $(`<li style="display:block" class="button-${this.get_nav_button_main_class(e.item[0])}"></li>`)
                    e = e.item;
                    if (e.css("display") === "none" || e.hasClass("hidden") || e.hasClass("compose"))
                    li.css("display", "none");

                    e.appendTo(li);
                    li.appendTo($("#taskmenu ul"));
                });

                $("#taskmenu .menu-last-frame ").attr("tabIndex", "-1");

                //On supprime le stockage si on y a pas accès.
                if (!rcmail.env.is_stockage_active)
                    $("#taskmenu .stockage").parent().remove();
            }

            return this;
        }

        /**
         * Met en place les actions pour les tâches qui en ont besoins.
         * @returns {Mel_Elastic} Chaînage
         */
        setup_tasks()
        {
            try {
                //Gérer le texte du bouton de login.
                if (rcmail.env.task == 'login' || rcmail.env.task == 'logout')
                    $('#rcmloginsubmit').val("Se connecter").html("Se connecter");

                //Revenir à la liste des mails sans rafraîchir la page.
                if (rcmail.env.task === "mail" && rcmail.env.action === "show" && !this.IS_EXTERNE)
                {
                    $(`<li role="menuitem"><a class="icon-mel-close" href="#back" title="Revenir aux mails"><span style="font-family:Roboto,sans-serif" class="inner">Retour</span></a></li>`)
                    .on("click", () => {
                        window.location.href = this.url("mail");
                    })
                    .prependTo($("#toolbar-menu"))
                }
            } catch (error) {
                
            }

            try {
                //Gérer le changement de mot de passe dans le login.
                $("#login-form p.formbuttons a").click(() => {
                      event.preventDefault();
                      window.location.href = window.location.href.replaceAll("/changepassword/index.php", "");
                  });
              } catch (error) {
                  console.error(error);
              }

            return this.setup_mails().setup_adressbook();
        }

        /**
         * Met en place les mails.
         * @returns {Mel_Elastic} Chaînage
         */
        setup_mails()
        {
            if (rcmail.env.task === "mail" && $("#mailsearchform").length > 0)
            {
                $("#mailsearchform").parent().parent().find(".unread").on("click",(e) => {
                    if (!$(e.target).hasClass("selected"))
                        $(e.target).attr("title", "Afficher tout les courriels");
                    else
                        $(e.target).attr("title", rcmail.gettext('showunread'));
                });
            }

            if (rcmail.env.task === "mail")
            {
                $(".task-mail #quotadisplay").prepend(`<span id='stockage-space-text'>Espace de stockage</span><p style="flex-basis: 100%;
                height: 0;
                margin: 0;"></p>`);

                //Gérer la prévisu des mails.
                rcmail.show_contentframe_parent = rcmail.show_contentframe;
                rcmail.show_contentframe = function(show)
                {
                    //On ne fait rien si en mode small ou phone
                    if (show && ( $("html").hasClass("layout-small") || $("html").hasClass("layout-phone")))
                    {
                        rcmail.show_contentframe_parent(show);
                        $("#layout-content").css("display", "").removeClass("layout-hidden")
                        return;
                    }
                    
                    if (rcmail.env.is_from_scroll === true)
                        delete rcmail.env.is_from_scroll;
                    else if ($("#layout-list").hasClass("initial") && show)
                    {
                        //Mise en place du système
                        $("#layout-content").css("display", "").removeClass("hidden layout-hidden");
                        $("#layout-list").removeClass("initial");

                        //On réduit la recherche au besoin
                        $("#mailsearchlist").addClass("hoverable").on("mouseover focusin", () => {
                            if ($("#mailsearchlist").hasClass("hoverable") && !$("#layout-list").hasClass("full"))
                                $("#mailsearchlist").removeClass("hoverable");
                        }).on("mouseleave focusout", () => {
                            if (document.activeElement === $("#mailsearchform")[0])
                                return;

                            if (!$("#mailsearchlist").hasClass("hoverable")  && !$("#layout-list").hasClass("full"))
                                $("#mailsearchlist").addClass("hoverable");
                        })
                        .find("#mailsearchform")
                        .on("focusout", (e) => {
                            if (e.relatedTarget === $("#mailsearchlist .reset")[0])
                                return;

                            if (!$("#mailsearchlist").hasClass("hoverable")  && !$("#layout-list").hasClass("full"))
                                $("#mailsearchlist").addClass("hoverable");
                        });

                        let $back = `<li role="menuitem" class="parent-close-visu">
                            <a  onclick="return rcmail.command('close-mail-visu','',this,event)"  class="close-visu"  role="button" href="#" ><span class="inner">Fermer</span></a>
                        </li>`;
                        

                        $("#layout-content ul#toolbar-menu").prepend($back);

                        //Fermer la prévisu
                        rcmail.register_command("close-mail-visu", () => {
                            $("#messagelist-content .selected").removeClass("selected").removeClass("focused").removeAttr("aria-selected").find(".selection input").click();

                            $("#layout-content").css("display", "none").addClass("hidden layout-hidden");
                            $("#layout-list").addClass("full");

                            $("#mailsearchlist").removeClass("hoverable");

                            // $("#messagelist-content .selected .selection input")[0].checked = false;
                            

                        }, true)
                        
                    }   
                    else if ($("#layout-list").hasClass("full") && show)
                    {
                        //Afficher ou fermer
                        $("#layout-content").css("display", "").removeClass("hidden").removeClass("layout-hidden");
                        $("#layout-list").removeClass("full");

                        $("#mailsearchlist").addClass("hoverable");
                        
                    }

                    rcmail.show_contentframe_parent(show);

                    let hidden = $("#layout-content .header #toolbar-menu .hidden-item-mt a");
                    if (hidden.length > 0)
                    {
                        hidden.each(async (i, e) =>{
                            let a = $(`#message-menu #${e.id}`);
                            if (a.hasClass("disabled") && !$(e).hasClass("disabled"))
                                a.removeClass("disabled")
                            else if (!a.hasClass("disabled") && $(e).hasClass("disabled"))
                                a.addClass("disabled")
                        });
                    }
                };/////////

                if (rcmail.env.action === "compose")
                {
                    //Ajouter "Envoyer" en haut.
                    $(".btn.btn-primary.send").remove();
                    $("#toolbar-menu").prepend(`
                        <li role="menuitem">
                            <a class="send" href=# onclick="return rcmail.command('send','',this,event)">Envoyer</a>
                        </li>
                    `);
                }
                else if (rcmail.env.action === "" || rcmail.env.action === "index")
                {
                    rcmail.addEventListener('init', () => { 
                        let i = 7;
                        let $aria = null;
                        
                        for (i; ($aria = $(`li[aria-level="${i}"] a`)).length > 0; ++i)
                        {
                            $aria.css('padding-left', `${i*1.5-2}em`);
                        }   
                    });

                    //Gestion de l'apparence et de l'affichage des mails.
                    	// add roundcube events
                    rcmail.addEventListener('insertrow', function(event) { 
                        var rowobj = $(event.row.obj);
                        rowobj.find(".selection input").on("change", () => {
                            let hidden = $("#layout-content .header #toolbar-menu .hidden-item-mt a");
                            if (hidden.length > 0)
                            {
                                hidden.each(async (i, e) =>{
                                    let a = $(`#message-menu #${e.id}`);
                                    if (a.hasClass("disabled") && !$(e).hasClass("disabled"))
                                        a.removeClass("disabled")
                                    else if (!a.hasClass("disabled") && $(e).hasClass("disabled"))
                                        a.addClass("disabled")
                                });
                            }
                        });
                    });

                    $('#mailsearchlist .searchbar .unread').before($(`<a class="button flag" href="#" role="button" title="Afficher les courriels suivis"></a>`).click((e) => {
                        const item = $(e.target);

                        if (item.hasClass('selected')) item.removeClass('selected');
                        else item.addClass('selected');
                        

                        $(rcmail.gui_objects.search_filter).val(!item.is('.selected') ? 'ALL' : 'FLAGGED');
                        rcmail.command('search');
                    }));

                    $("#toolbar-list-menu .compose").parent().prependTo($("#toolbar-list-menu .compose").parent().parent());
                
                    //Ajout de "plus"
                    $("#toolbar-list-menu").append($(`
                        <li id="limelmailplusmenu" class="marked" style="display:none" role="menuitem">
                        
                        </li>
                    `).append($("#melplusmails").css("display", "")))

                    const mailConfig = rcmail.env.mel_metapage_mail_configs;

                    let test = new ResizeObserver(() => {
                        let value = 0;
                        {
                            let iterator;
                            for (iterator of  $('#toolbar-list-menu li')) {
                                iterator = $(iterator);
                                if (!iterator.hasClass('marked'))
                                {
                                    value += iterator.width();
                                }
                            }
                            iterator = null;
                            const additional_width =  $('.header .toolbar-button.refresh').width();
                            value += additional_width + (additional_width / 2.0);
                        }
                        const max = $('#layout-list').width() - $('#mail-search-border').width();//mailConfig === null || mailConfig["mel-icon-size"] === rcmail.gettext("normal", "mel_metapage") ? 370 : 347; //370;

                        if (value > max)
                        {
                            $("#toolbar-list-menu li").css("display", "none").find(".compose").parent().css("display", "");
                            $("#limelmailplusmenu").css("display", "")
                        }
                        else {
                            $("#toolbar-list-menu li").css("display", "");
                            $("#limelmailplusmenu").css("display", "none");
                        }

                        if (!$("html").hasClass("touch") && $("#toolbar-list-menu").hasClass("hidden")) 
                        {
                            $("#toolbar-list-menu").removeClass("hidden")
                            .removeAttr("aria-hidden");
                        }

                        if (rcmail.env.search_initialized !== true && window.innerWidth < 410)
                        {
                            rcmail.env.search_initialized = true;
                            $("#mailsearchlist").addClass("hoverable").click((e) => {
                                
                                //console.log("e", $("#mailsearchlist").hasClass("stopclick"));
                                if ($("#mailsearchlist").hasClass("stopclick"))
                                {
                                    $("#mailsearchlist").removeClass("stopclick")

                                    if (!$("#mailsearchlist").hasClass("hoverable"))
                                    {
                                        $("#mailsearchlist").addClass("hoverable")
                                        return;
                                    }
                                }

                                if (window.innerWidth < 410)
                                {
                                    $("#mailsearchlist").removeClass("hoverable");
                                    $("#mailsearchlist input").focus();
                                }
                            }).find("input").on("focusout", (e) => {
                                if (window.innerWidth < 410)
                                {
                                    let parent = e.originalEvent === null || e.originalEvent.explicitOriginalTarget === null ? null : $(e.originalEvent.explicitOriginalTarget);
                                    while (parent !== null && parent.attr("id") != "mailsearchlist" && parent[0].nodeName != "BODY" && !parent.hasClass("icon-mel-search"))
                                    {
                                        //console.log("parent", parent);
                                        parent = parent.parent();
                                    }

                                    if (parent === null || parent.hasClass("icon-mel-search") || parent[0].nodeName === "BODY")
                                    {
                                        if (parent.hasClass("icon-mel-search"))
                                            $("#mailsearchlist").addClass("stopclick");
                                        else {
                                            $("#mailsearchlist").addClass("hoverable");
                                        }
                                        document.activeElement.blur();
                                    }
                                }
                            });

                        }
                    });
                    test.observe($("#layout-list")[0]);

                    
                    if (mailConfig !== null)
                    {
                        let _css = "";

                        //Taille des icônes
                        if (mailConfig["mel-icon-size"] !== rcmail.gettext("normal", "mel_metapage"))
                        {
                            _css += `
                            #toolbar-menu li a,
                            #messagelist-header a.refresh,
                            #toolbar-list-menu li a {
                                font-size: 0.9rem;
                            }
    
                            
                            `;
                        }

                        //Espacement des dossiers
                        if (mailConfig["mel-folder-space"] === rcmail.gettext("larger", "mel_metapage"))
                            _css += `
                            
                            #folderlist-content li {
                                margin-top: 10px;
                            }
                            
                            `;
                        else if (mailConfig["mel-folder-space"] === rcmail.gettext("smaller", "mel_metapage"))
                            _css += `
                                
                            #folderlist-content li {
                                margin-top: -5px;
                            }
                            
                            `;

                        //Espacement des messages
                        if (mailConfig["mel-message-space"] === rcmail.gettext("larger", "mel_metapage"))
                            _css += `
                            
                            #messagelist tr.message td {
                                padding-top: 1rem;
                                padding-bottom: 1rem;
                            }
                            
                            `;
                        else if (mailConfig["mel-message-space"] === rcmail.gettext("smaller", "mel_metapage"))
                            _css += `
                                
                            #messagelist tr.message td {
                                padding-top: 0;
                                padding-bottom:0;
                            }
                            
                            `;


                        var style=document.createElement('style');
                        style.type='text/css';

                        if(style.styleSheet){
                            style.styleSheet.cssText = _css;
                        }else{
                            style.appendChild(document.createTextNode(_css));
                        }
                        document.getElementsByTagName('head')[0].appendChild(style);
                    }

                    //message_extwin @Rotomeca
                    const alias_mel_rcmail_show_message = rcmail.show_message
                    rcmail.show_message = function(id, safe, preview)
                    {
                        const openInPopUp = !preview && !this.env.message_extwin && !this.env.extwin;

                        if (openInPopUp) {
                            let url = this.params_from_uid(id, {_caps: this.browser_capabilities()});

                            if (safe) url._safe = 1;
                            url._extwin = 1;
                            url = this.url('show', url);
                            new Windows_Like_PopUp(top.$("body"), 
                            {
                                title:"Ouverture d'un mail...",
                                content:`<center><div class='spinner-border'></div></center><iframe title="Ouverture d'un mail" src="${url + "&_is_from=iframe"}" style="width:100%;height:calc(100%);display:none;"/>`,
                                afterCreatingContent($html, box, popup) {
                                    box.content.find("iframe").on('load', () => {
                                        let $iframe = box.content.find("iframe");
                                        const title = $iframe[0].contentDocument.title;
                                        const delete_action = function delete_action () {
                                            try {
                                                rcmail.command('checkmail');
                                            } catch (error) { }
                                            box.close.click();
                                        };

                                        box.title.find('h3').html(title);
                                        box.content.find(".spinner-border").remove();
                                        $iframe.css('display', '');
                                        $iframe[0].contentWindow.Windows_Like_PopUp = Windows_Like_PopUp;
                                        $iframe[0].contentWindow.rcmail.env.is_in_popup_mail = true;
                                        $iframe[0].contentWindow.rcmail.addEventListener('message.deleted', async (event) => {
                                            delete_action();
                                        });
                                        $iframe[0].contentWindow.rcmail.addEventListener('message.moved', async (event) => {
                                            delete_action();
                                        });
                                        $iframe[0].contentWindow.rcmail.addEventListener('message.junk', async (event) => {
                                            delete_action();
                                        });

                                        if (popup._minified_header)
                                        {
                                            popup._minified_header.find('h3').html((title.length > 20 ? (title.slice(0, 20) + '...') : title));
                                        }
                                    });

                                    let spinner = box.content.find(".spinner-border").css("width", '30%');
                                    let spinner_size = Math.round(spinner.width());
                                    spinner.css("width", `${spinner_size}px`)
                                    .css('height', `${spinner_size}px`).css('margin', '15px');
                                    
                                },
                                width:"calc(100% - 60px)",
                                height:"calc(100% - 60px)",
                                context:top,
                                fullscreen:true
                            }
                            );
                        }
                        else alias_mel_rcmail_show_message.call(this, id, safe, preview);
                    };                
                }
                else if (rcmail.env.action ==="preview" || rcmail.env.action ==="show"){
                    $("#message-header .headers-table td").each((i,e) => {
                        switch ($(e).html()) {
                            case "De":
                                $(e).parent().addClass("mel-header-from");
                                break;
                            case "Date":
                                $(e).parent().addClass("mel-header-date");
                                break;
                        
                            default:
                                break;
                        }
                    });

                    $("#mel-message-details").click(() => {
                        const plus = "icon-mel-plus";
                        const minus = "icon-mel-minus";
                        let querry = $("#mel-message-details .mel-d-icon");

                        if (querry.hasClass(minus))
                        {
                            querry.removeClass(minus).addClass(plus);
                            $(".message-partheaders").hide();
                        }
                        else
                        {
                            querry.removeClass(plus).addClass(minus);
                            $(".message-partheaders").show();
                        }
                    })
                }

                const alias_mel_rcmail_permanently_remove_messages = rcmail.permanently_remove_messages;
                rcmail.permanently_remove_messages = function() {
                    alias_mel_rcmail_permanently_remove_messages.call(this);
                    rcmail.triggerEvent('message.deleted');
                }

                const alias_mel_rcmail_move_messages = rcmail.move_messages;
                rcmail.move_messages = function(mbox, event, uids) {
                    alias_mel_rcmail_move_messages.call(this, mbox, event, uids);
                    rcmail.triggerEvent('message.moved', {mbox, uids, e:event});
                }

                rcmail.addEventListener('responsebeforeplugin.markasjunk.junk', () => {
                    rcmail.triggerEvent('message.junk', {junk:true});
                });

                rcmail.addEventListener('responsebeforeplugin.markasjunk.not_junk', () => {
                    rcmail.triggerEvent('message.junk', {junk:false});
                });

            }

            return this.setup_mails_classes().setup_compose();
        }

        /**
         * Met en place les actions relative aux mails 
         * @returns 
         */
        setup_mails_classes()
        {
            if (rcmail.env.task === "mail")
            {
                let action = ($querry, _class) => {
                    if (!$querry.attr("id").includes("clone"))
                    {
                        $querry.addClass("mel").parent().addClass(`mel-li-${_class}`);
                    }
                };

                let testing = (e, _class) => {
                    const array = Enumerable?.from(e.classList)?.toArray() ?? [];
                    const count = array.length;
                    if (count === 1) action($(e), _class);
                    else if (count === 2 && array.includes(_class) && (array.includes("disabled") || array.includes("active")))
                    {
                        action($(e), _class);
                    }
                };

                //Répondre
                $("#toolbar-menu .reply").each((i,e) => {
                    testing(e, "reply");
                });

                //transfert
                $("#toolbar-menu .forward").each((i,e) => {
                    testing(e, "forward");
                });
            }

            return this;
        }

        /**
         * Met en place la rédaction d'un mail.
         * @returns {Mel_Elastic} Chaînage
         */
        setup_compose()
        {
            //Si on se trouve au bon endroit.
            if (rcmail.env.task === "mail" && rcmail.env.action === "compose")
            {
                const key = "bnum_last_fields";
                //Sauvegarder le champs
                $("a.input-group-text.icon.add").click(() => {
                    $("#headers-menu ul.menu a.recipient.active").each((i,e) => {
                        e = $(e);
                        e.click(() => {
                            let storage = mel_metapage.Storage.get(key);
                            
                            if (storage === undefined || storage === null)
                                storage = [];

                            const field = e.data("target");
                            if (!storage.includes(field))
                            {
                                storage.push(field);
                                mel_metapage.Storage.set(key, storage);
                            }
                            
                        });
                    });
                });

                //Supprimer le champ
                $("a.input-group-text.icon.delete").each((i,e) => {
                    e = $(e);
                    e.click(() => {
                        let $input = e.parent().parent().find("textarea");

                        if ($input.length === 0)
                            $input = e.parent().parent().find("input");

                        const field = $input.attr("id").replace("_", "");
                        let storage = mel_metapage.Storage.get(key);
                        
                        if (storage.includes(field))
                        {
                            storage = Enumerable?.from(storage)?.where(x => x !== field)?.toArray() ?? [];
                            mel_metapage.Storage.set(key, storage);
                        }
                    });
                });

                const storage = mel_metapage.Storage.get(key);

                //Afficher les champs
                if (storage !== null && storage.length > 0)
                {
                    for (let index = 0; index < storage.length; ++index) {
                        const element = storage[index];
                        $(`#compose_${element}`).removeClass("hidden");
                    }
                }

                //Gestion des options
                if (rcmail.env.compose_option !== undefined && rcmail.env.compose_option !== null && rcmail.env.compose_option !== "")
                {
                    switch (rcmail.env.compose_option) {
                        case "empty":
                            $("#compose-subject").val("");
                            try {
                                $("#compose-subject").change();
                            } catch (error) {
                                
                            }
                            
                            // rcmail.addEventListener('editor-load', () => {
                            //     if (rcmail.env.editor_emptied !== true)
                            //     {
                            //         rcmail.editor.set_content("");
                            //         rcmail.env.editor_emptied = true;
                            //     }
                            // });

                                
                            
                            break;
                    
                        default:
                            break;
                    }
                }

                if (top !== window)
                {
                    $("#toolbar-menu a.send").removeAttr('href');
                }

                if (window === top && rcmail.env.extwin !== 1)
                {
                    let $tmp_quit = $(`<a style="margin-right:15px" class="back" href="#" >Messages</a>`).click(() => {
                        rcmail.env.action='index';
                        rcmail.action = 'index';
                        rcmail.compose_skip_unsavedcheck = true;
                        const _$ = top.$;
        
                        _$('.task-mail.action-compose #taskmenu li a').removeClass('disabled').removeAttr('disabled');
                        _$('.barup button').removeClass('disabled').removeAttr('disabled');
                        _$('#barup-search-input').removeClass('disabled').removeAttr('disabled');
                        _$('#user-up-popup').css('pointer-events', 'all');
                        _$('.tiny-rocket-chat').removeClass('disabled').removeAttr('disabled');
                        _$('.task-mail.action-compose #taskmenu li a.menu-last-frame').addClass('disabled').attr('disabled', 'disabled');
        
                        if (_$('iframe.mail-frame').length > 0) mel_metapage.Functions.change_frame('mail', true, true);
                        else if (_$('.mail-frame').length > 0) {
                            _$('.mail-frame').remove();
                            mel_metapage.Functions.change_frame('mail', true, true);
                        }
                        else mel_metapage.Functions.change_frame('mail', true, true);
        
                        _$('body').removeClass('action-compose').addClass('action-none');
                    });
        
                    $("ul#toolbar-menu").prepend($(`<li role="menuitem">
                    
                    </li>`).append($tmp_quit));
    
                    $('.task-mail.action-compose #taskmenu li a').addClass('disabled').attr('disabled', 'disabled');
                    $('.barup button').addClass('disabled').attr('disabled', 'disabled');
                    $('#barup-search-input').addClass('disabled').attr('disabled', 'disabled');
                    $('#user-up-popup').css('pointer-events', 'none');
                    const interval = setInterval(() => {
    
                        if (!$('.tiny-rocket-chat').hasClass('disabled'))
                        {
                            $('.tiny-rocket-chat').addClass('disabled').attr('disabled', 'disabled');
                        }
                        else clearInterval(interval);
                    }, 100);
    
                    $("#layout-content").css('margin-left', '60px');
                }

            }

            rcmail.addEventListener('fileappended', (file) => {
                //console.log("file", file);
                if (file.attachment.html.includes('class="delete"'))
                {
                    $('a.delete').html("");
                }
            });

            const alias_mel_rcmail_open_compose_step = rcmail.open_compose_step;
            rcmail.open_compose_step = function (p) {
                if (window.create_popUp !== undefined) create_popUp.close();

                if ((rcmail.env.compose_extwin && !rcmail.env.extwin) || (rcmail.env.extwin)) 
                {
                    if (rcmail.env.extwin && rcmail.env.is_in_popup_mail === true)
                    {
                        var last_ext_win = rcmail.env.extwin;
                        rcmail.env.extwin = 0;

                        if (!rcmail.env.compose_extwin)
                        {
                            rcmail.open_compose_step(p);
                            rcmail.env.extwin = last_ext_win
                            return;
                        }
                    }

                    alias_mel_rcmail_open_compose_step.call(this, p);

                    if (last_ext_win !== undefined) rcmail.env.extwin = last_ext_win;
                }
                else {
                    p['_extwin'] = 1;
                    const url = rcmail.url('mail/compose', p);
                    let config = {
                        title:"Rédaction",
                        content:`<center><div class='spinner-border'></div></center><iframe title="Rédaction d'un mail" src="${url + "&_is_from=iframe"}" style="width:100%;height:calc(100%);"/>`,
                        onclose(popup) {
                            if (popup.box.close.data('force') == '1') return;
                            if (popup.waiting_save !== true && confirm('Voulez-vous sauvegarder le message comme brouillon ?'))
                            {
                                popup.waiting_save = true;
                                popup.box.close.addClass('disabled').attr('disabled', 'disabled');
                                popup.box.minifier.addClass('disabled').attr('disabled', 'disabled');
                                popup.box.title.find('h3').html(popup.box.title.find('h3').html().replace('Rédaction : ', 'Sauvegarde de : '))
                                
                                if (popup.box.minifier.find("span").hasClass(popup.settings.icon_minify))
                                    popup.minify();

                                let frame_context = popup.box.content.find("iframe")[0].contentWindow;

                                const alias_mel_rcmail_compose_field_hash = frame_context.rcmail.compose_field_hash;
                                frame_context.rcmail.compose_field_hash = function(save) {
                                    alias_mel_rcmail_compose_field_hash.call(this, save);
                                    popup.close();
                                };

                                frame_context.rcmail.command('savedraft');

                                return 'break';
                            }
                        },
                        afterCreatingContent($html, box) {
                            box.close.data('force', '1');
                            box.content.find("iframe").on('load', () => {
                            box.close.data('force', '');
                            let frame_context = box.content.find("iframe")[0].contentWindow;

                            frame_context.$('#layout-sidebar .scroller').css("max-height", '100%');

                            frame_context.$('#compose-subject').on('input', (e) => {
                                box.title.find('h3').html('Rédaction : ' + $(e.currentTarget).val());
                            }).on('change', (e) => {
                                box.title.find('h3').html('Rédaction : ' + $(e.currentTarget).val());
                            });

                            box.content.find("center").css('display', 'none');
                            const obj = frame_context.$('#compose-subject').val();

                            if ((obj ?? "") !== "") box.title.find('h3').html('Rédaction : ' + obj);

                            frame_context.rcmail.addEventListener('message_submited', async (args) => {
                                if (args.draft !== true)
                                {
                                    box.get.find('iframe').css("display", 'none');
                                    box.close.addClass('disabled').attr('disabled', 'disabled');
                                    box.title.find('h3').html(box.title.find('h3').html().replace('Rédaction : ', 'Envoi de : '));
                                    box.content.find("center").css('display', '');
                                }
                            });

                            frame_context.rcmail.addEventListener('message_sent', async (args) => {
                                rcmail.display_message(args.msg, args.type);
                                box.close.data('force', '1');
                                box.close.removeClass('disabled').removeAttr('disabled');
                                const interval = setInterval(() => {
                                    if (rcmail.busy === false)
                                    {

                                        let frame = top.$('iframe.mail-frame');
                                        if (frame.length > 0)
                                        {
                                            frame[0].contentWindow.rcmail.command('checkmail', '');
                                        }
                                        frame = null;

                                        rcmail.command('checkmail', '');
                                        clearTimeout(interval);
                                    }
                                }, 100);
                                box.close.click();
                            });

                            frame_context.rcmail.addEventListener('plugin.message_send_error', ($args) =>
                            {
                                console.error('###[plugin.message_send_error]', $args);
                                rcmail.display_message("Impossible d'envoyer le mail !", 'error');
                                box.close.removeClass('disabled').removeAttr('disabled');
                                box.get.find('iframe').css("display", '');
                                box.title.find('h3').html(box.title.find('h3').html().replace('Envoi de : ', 'Rédaction : '));
                                box.content.find("center").css('display', 'none');
                            });

                            frame_context.$("#toolbar-menu a.send").removeAttr('href');

                            if (frame_context.rcmail.env.is_model) box.close.data('force', '1');

                            });

                            let spinner = box.content.find(".spinner-border").css("width", '30%');

                            let spinner_size = Math.round(box.content.find(".spinner-border").width()); 

                            spinner.css("width", `${spinner_size}px`)
                            .css('height', `${spinner_size}px`).css('margin', '15px');
                            
                        },
                        width:"calc(100% - 60px)",
                        height:"calc(100% - 60px)",
                        context:top,
                        fullscreen:true
                    };
            
                    const popup_class = window.Windows_Like_PopUp ?? top.Windows_Like_PopUp;
                    return new popup_class(top.$("body"), config);
                }
            };

            const alias_mel_rcmail_submit_messageform = rcmail.submit_messageform;
            rcmail.submit_messageform = function(draft, saveonly) {
                alias_mel_rcmail_submit_messageform.call(this, draft, saveonly);

                rcmail.triggerEvent('message_submited', {
                    draft, saveonly
                });
            };

            const alias_mel_rcmail_sent_successfully = rcmail.sent_successfully;
            rcmail.sent_successfully = function (type, msg, folders, save_error) {
                alias_mel_rcmail_sent_successfully.call(this, type, msg, folders, save_error);

                rcmail.triggerEvent('message_sent', {
                    type, msg, folders, save_error
                });
            }

            return this;
        }

        /**
         * Met en place certaines actions pour les contacts
         * @returns {Mel_Elastic} Chaînage
         */
        setup_adressbook()
        {
            if (rcmail.env.task === "addressbook" && rcmail.env.action === "show" && window != parent && rcmail.env.accept_back === true)
            {
                let $tmp = $(`<button type="button" class="btn btn-secondary mel-button create mel-before-remover">Retour <span class="plus icon-mel-undo "></span></button>`)
                .on("click", () => {
                    return top.rcmail.command('mel.metapage.contacts.back');
                    // let $args = {
                    //     _source:rcmail.env.annuaire_source
                    // };

                    // parent.postMessage({
                    //     exec:"searchToAddressbook",
                    //     _integrated:true,
                    //     child:false
                    // }, '*');

                    // rcmail.set_busy(true, "loading");
                    // window.location.href = this.url("addressbook", "plugin.annuaire", $args);


                });
                $("#contacthead").append($tmp);
            }

            return this;
        }

        /**
         * Met en place la recherche
         * @returns 
         */
        setup_search() {
            let $sbox = $('#quicksearchbox');

            if ($sbox.length === 0) $sbox = $('#searchform');

            if ($sbox.length > 0) $sbox.on('change', () => {
                $sbox.parent().submit();
            });

            return this;
        }

        /**
         * Met en place la barre de navigation pour les autres applis.
         * @returns {Mel_Elastic} Chaînage
         */
        setup_other_apps(ignoreStart = false)
        {
            if (!ignoreStart)
            {
                //Enrobe les "a" par des "li".
                $("#listotherapps").find("a").each((i,e) => {
                    let tmp = $("<li style=width:100%></li>").appendTo($("#listotherapps"));
                    $(e).addClass("mel-focus").appendTo(tmp);
                });
            }

            //Gestion de la barre.
            $("#listotherapps").find("a").on('focusout', (e) => {

                $("#menu-overlay").remove();
                if (!$(e.relatedTarget).parent().parent().hasClass("listotherapps"))
                {
                    if (!$(e.relatedTarget).hasClass("more-options") && $("#otherapps").css("display") !== "none")
                    {
                        $("a.more-options").click();
                        if ($("html").hasClass("touch"))
                        {

                            $("#touchmelmenu").click();
                        }
                    }
                }
            });

            // rcmail.addEventListener('plugin.message_send_error', ($args) =>
            // {
            //     top.rcmail.command('message_send_error', $args);
            // });

            return this;
        }

        /**
         * Met en place diverses choses qui concerne les choses invisibles.
         * @returns {Mel_Elastic} Chaînage
         */
        setup_html()
        {
            try {
                $('meta[name=viewport]').attr("content", $('meta[name=viewport]').attr("content").replace(", maximum-scale=1.0", ""));
            } catch (error) {
                
            }

            return this;
        }

        /**
         * Met en place le calendrier
         * @returns 
         */
        setup_calendar()
        {
            if (rcmail.env.task === "calendar")
            {
                let $waiting_events = $("#layout-sidebar .waiting-events-number");

                if ($waiting_events.length > 0)
                {
                    $waiting_events.on('mouseenter', () => {
                        const id = 'waiting-events-list';
                        const id_child = 'waiting-events-list-items';
                        const id_selector = `#${id}`;
                        if ($(id_selector).length > 0) 
                        {
                            return;
                        }

                        const events = rcube_calendar.get_number_waiting_events(false)

                        if (!!events && events.length > 0)
                        {
                            let $we_list = $(`<div id="${id}"><div id="${id_child}"></div></div>`)

                            let $wel_items = $we_list.find(`#${id_child}`);

                            const format = 'DD/MM/YYYY HH:mm';
                            const size = events.length;
                            for (let index = 0; index < size; ++index) {
                                const element = events[index];
                                $wel_items.append($(`
                                <button title="Evènement ${element.title}, cliquez pour afficher l'évènement" class="waiting-event-button mel-button">
                                    <span class="waiting-event-title">${element.title}</span>
                                    <span class="waiting-event-horodate">${moment(element.start).format(format)} - ${moment(element.end).format(format)}</span>
                                </button>
                                `).click(() => {
                                    top.SearchResultCalendar.CreateOrOpen(JSON.stringify(element));
                                }));
                            }

                            $waiting_events.append($we_list);
                        }


                    })
                    .on('mouseleave', (e) => {
                        const id = 'waiting-events-list';
                        const id_selector = `#${id}`;

                        if ($(id_selector).length > 0) $(id_selector).remove();
                    });
                }
            }

            return this;
        }

        /**
         * Renvoie vrai si les barre de défilements sont en mode automatique
         * @returns 
         */
        isScollBarAuto()
        {
            if (!this.auto_text) this.auto_text = rcmail.gettext('auto', 'mel_metapage');

            return rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] === this.auto_text;
        }

        updateScollBarMode()
        {
            const css_key = 'scroll_bar_size';
            if (this.css_rules.ruleExist(css_key))
            {
                this.css_rules.remove(css_key);
            }

            if (this.isScollBarAuto() && !this.updateScollBarMode.initialized)
            {
                let ele;
                let distance;
                let last_target = null;
                document.addEventListener("mousemove", function(e){
                    if (UI.is_touch() === false && MEL_ELASTIC_UI.isScollBarAuto())
                    {
                        ele = e.target;
    
                        if (!!last_target) {
                            if (ele !== last_target) {
                                $('.more-width').removeClass('more-width');
                                last_target = ele;
                            }
                        }
                        else last_target = ele;
        
                        distance = ele.offsetLeft + ele.offsetWidth - e.pageX;
                        distance < 15 && distance > -15 ? ele.classList.add('more-width') : ele.classList.remove('more-width');
                    }
                });
                
                this.updateScollBarMode.initialized = true;
            }
            else if (rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] === rcmail.gettext('normal', 'mel_metapage'))
            {
                this.css_rules.addAdvanced(css_key, ':root',  
                    '--scrollbar-width-moz:var(--scrollbar-width-moz-normal)!important', 
                    '--scrollbar-width-webkit:var(--scrollbar-width-webkit-normal)!important');
            }
            else if (rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] === rcmail.gettext('large', 'mel_metapage'))
            {
                this.css_rules.addAdvanced(css_key, ':root', 
                    '--scrollbar-width-webkit:var(--scrollbar-width-webkit-large)!important',
                    '--scrollbar-width-moz:var(--scrollbar-width-moz-large)!important');
            }

            return this;
        }

        /**
         * Met à jours la page.
         * @returns {Mel_Elastic} Chaînage
         */
        update()
        {
            return this
            .update_tabs()
            .update_pagination()
            .updateScollBarMode()
            .redStars();
        }

        /**
         * Met à jours le système d'onglet
         * @returns {Mel_Elastic} Chaînage
         */
        update_tabs()
        {
            let querry = $(".mel-tabheader");

            if (querry.length > 0)
            {
                querry.unbind('click');
                querry.on("click", (e) => {
                    //console.log("MEL_ELASTIC", this, e);
                    this.switchTab(e.currentTarget);
                })
                querry.each((i,e) => {
                    let parent = $(e).parent();

                    if (!parent.hasClass("mel-ui-tab-system"))
                    {
                        this.gestionTabs(parent);

                        for (let index = 0; index < e.classList.length; ++index) {
                            const element = e.classList[index];
                            
                            if (element.includes("tab-"))
                            {
                                $(`.${element}.mel-tabheader`).each((index, element) => {
                                    if (index !== 0)
                                        $(element).attr("tabindex", -1);
                                });
                                break;
                            }

                        }

                    }

                    
                });
            }

            querry = $(".select-button-mel");

            if (querry.length > 0)
            {
                querry.unbind('click');
                querry.on("click", (e) => {
                    this.generateSelect(e.currentTarget);
                });
            }

            return this;
        }

        /**
         * Met à jours le système de pagination.
         * @returns {Mel_Elastic} Chaînage
         */
        update_pagination()
        {
            let querry = $(".pagination");

            if (querry.length > 0)
            {
                querry.each((i,e) => {
                    e = $(e);
                    this.set_pagination(e, e.data("count"), e.data("current") === undefined ? null : e.data("current"));
                    return this;
                });
            }

            return this;
        }

        ////////////************* Main functions *************///////////

        /**
         * Gère les étoiles rouges.
         * @returns {Mel_Elastic} Chaînage
         */
        redStars()
        {
            let querry = $(".red-star-after");
            
            if (querry.length > 0)
            {
                $(".red-star-after").each((i,e) => {
                    e = $(e);

                    if (!e.hasClass("mel-after-remover"))
                        e.append('<star class="red-star mel-before-remover">*</star>').addClass("mel-after-remover");

                });
            }

            querry = $(".red-star");

            if (querry.length > 0)
            {
                querry.each((i,e) => {
                    e = $(e);

                    if (!e.hasClass("mel-before-remover"))
                        e.prepend('<star class="red-star mel-before-remover">*</star>').removeClass("red-star").addClass("red-star-removed");

                });
            }

            return this;
        }

        /**
         * Switch de thème (sombre/light)
         * @returns {Mel_Elastic} Chaînage
         */
        switch_color()
        {
            rcmail.triggerEvent("switch_color_theme");
            return this._update_theme_color();
        }

        /**
         * Retourne le thème en cours
         * @returns {string} dark/light
         */
        color_mode()
        {
            return $('html').hasClass("dark-mode") ? "dark" : "light";
        }

        _update_theme_color()
        {
            let $html = $('html');

            if (this.color_mode() === "dark")
            {
                $html.removeClass(`theme-${this.get_current_theme().toLowerCase()}`);
            }
            else if (this.get_current_theme() !== 'default') {
                $html.addClass(`theme-${this.get_current_theme().toLowerCase()}`);
            }
            
            $('iframe.mm-frame').each((i,e) => {
                e.contentWindow.MEL_ELASTIC_UI._update_theme_color();
            });

            return this;
        }

        ////////////************* Other functions *************///////////
        /**
         * Récupère la classe principale d'un bouton de la barre de navigation
         * @param {DomElement} button - Ne doit pas être du JQUERY
         * @returns {string} - Classe principale ou "no-class-found" si aucune classe principale trouvé.
         */
        get_nav_button_main_class(button)
        {
            const list = button.classList;
            for (const key in list) {
                if (Object.hasOwnProperty.call(list, key)) {
                    const element = list[key];
                    switch (element) {
                        case "mel-focus":
                        case "selected":
                        case "order1":
                        case "mel":
                        case "disabled":
                        case "hidden":
                            continue;
                    
                        default:

                            if (element.includes("icofont"))
                                continue;
                            if (element.includes("icon-mel-"))
                                continue;
                            if (element.includes("button"))
                                continue;

                            return element;
                    }
                }
            }

            return "no-class-found";
        }

        /**
         * Génère une couleur au hasard.
         * @returns {string} Couleur héxadécimale
         */
        getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        /**
         * Récupère la différence de 2 réctangles.
         * @param {DOMRect} rect1 Rectangle à soustraire
         * @param {DOMRect} rect2 Rectangle de soustraction
         * @returns {{top:number, left:number, right:number, bottom:number, rect1:DOMRect, rect2:DOMRect}} Résultats
         */
        getRect(rect1, rect2)
        {
            return {
                top:rect1.top-rect2.top,
                left:rect1.left-rect2.left,
                right:rect1.right-rect2.right,
                bottom:rect1.bottom-rect2.bottom,
                rect1,
                rect2
            };
        }

        /**
         * Récupère une url correcte
         * @param {string} task Tâche que l'on souhaite
         * @param {string} action Action que l'on souhaite
         * @param {JSON} args Arguments supplémentaires
         * @returns {string} Url fonctionnel
         */
        url(task, action = "", args = null)
        {
            if (window.mel_metapage !== undefined)
                return mel_metapage.Functions.url(task, action, args);
            else
            {

                let tmp = "";

                if (action !== "")
                    tmp += "&_action=" + action;

                if (window.location.href.includes(this.FROM_INFOS.key) && window.location.href.includes(this.FROM_INFOS.value))
                {
                    if (args === null || args === undefined)
                        args = {};
                    
                    args[this.FROM_INFOS.key] =  this.FROM_INFOS.value;
                }

                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        tmp += "&" + key + "=" + element;
                    }
                }
                return rcmail.get_task_url((task + tmp), window.location.origin + window.location.pathname);
            }
        }

        /**
         * Récupère une recherche de contact avec autocompletion.
         * @param {string} id Id de l'input 
         * @returns {string} html
         */
        get_input_mail_search(id = '')
        {
            let html = "Participants<span class=red-star></span>";
            html += '<div class="input-group">';
		    html += '<textarea name="_to_workspace" spellcheck="false" id="to-workspace" tabindex="-1" data-recipient-input="true" style="position: absolute; opacity: 0; left: -5000px; width: 10px;" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></textarea>';
            html += '<ul id="wspf" class="form-control recipient-input ac-input rounded-left">'
                                /* <li class="recipient">
                                    <span class="name">delphin.tommy@gmail.com</span>
                                    <span class="email">,</span>
                                    <a class="button icon remove"></a></li> */
            html += '<li class="input"><input id="'+id+'" onchange="m_mp_autocoplete(this)" oninput="m_mp_autocoplete(this)" type="text" tabindex="1" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></li></ul>';
			html += '<span class="input-group-append">';
		    html += `<a href="#add-contact" onclick="m_mp_openTo(this, '${id}')" class="input-group-text icon add recipient" title="Ajouter un contact" tabindex="1"><span class="inner">Ajouter un contact</span></a>`;
			html +=	'			</span>';
			html += '			</div>';
            return html;
        }

        ////////////************* Select box functions *************///////////
        /**
         * Créer une selectbox stylisé via un élément
         * @param {JQUERY} event Jquery élément
         * @returns {Mel_Elastic} Chaînage
         */
        generateSelect(event)
        {
            event = $(event);
            const rc = typeof event.data("rcmail") === "string" ? event.data("rcmail") === "true" : event.data("rcmail");
            
            if (rc)
            {
                if (rcmail.is_busy)
                    return;
            }
            
            //console.log("generateSelect", event.data("options"), typeof event.data("options"), event);
            const options = typeof event.data("options") === "string" ? JSON.parse(event.data("options").includes("¤¤¤") ? event.data("options").replaceAll('¤¤¤', '"') : event.data("options")) : event.data("options");
            const options_class = typeof event.data("options_class") === "string" ? JSON.parse(event.data("options_class").includes("¤¤¤") ? event.data("options_class").replaceAll('¤¤¤', '"') : event.data("options_class")) : event.data("options_class");
            const options_title = typeof event.data("option-title") === "string" ? JSON.parse(event.data("option-title").includes("¤¤¤") ? event.data("option-title").replaceAll('¤¤¤', '"') : event.data("option-title")) : event.data("option-title");
            const options_current_title = typeof event.data("option-title-current") === "string" ? JSON.parse(event.data("option-title-current").includes("¤¤¤") ? event.data("option-title-current").replaceAll('¤¤¤', '"') : event.data("option-title-current")) : event.data("option-title-current");
            const update = event.data("event");
            const is_icon = typeof event.data("is_icon") === "string" ? event.data("is_icon") === "true" : event.data("is_icon");
            const value = event.data("value");
            const onchange = event.data("onchange");// = typeof event.data("on") === "string" ? JSON.parse(event.data("on").includes("¤¤¤") ? event.data("on").replaceAll('¤¤¤', '"') : event.data("on")) : event.data("on");
            //Create selectbox
            if (event.parent().css("position") !== "relative")
                event.parent().css("position", "relative");

            let html = '<div class="btn-group-vertical">';

            for (const key in options) {
                if (Object.hasOwnProperty.call(options, key)) {
                    const element = options[key];
                    const current_option_class = options_class !== null && options_class !== undefined && options_class[key] !== undefined ? options_class[key] : "";
                    const current_option_title = options_title !== null && options_title !== undefined && options_title[key] !== undefined ? options_title[key] : "";
                    const new_option_title =  options_current_title !== null && options_current_title !== undefined && options_current_title[key] !== undefined ? options_current_title[key] : "";
                    html += '<button title="'+current_option_title+'" onclick="MEL_ELASTIC_UI.updateSelectValue(`'+key+'`, `'+new_option_title+'`)" class="'+current_option_class+' mel-selected-content-button btn btn-primary '+(value === key ? "active" : "")+'">'+(is_icon ? ("<span class="+element+"></span>") : element)+'</button>'
                }
            }

            html += "</div>";
            const rect = this.getRect(event[0].getBoundingClientRect(), event.parent()[0].getBoundingClientRect() );
            html = $(html)
            .css("position", "absolute")
            .css("top", rect.top+rect.rect1.height)
            .css("left", rect.left)
            .css("z-index", 50)
            .addClass("mel-select-popup");
            event.parent().append(html);
            event.on("focusout", (e) => {
                if ($(e.relatedTarget).hasClass("mel-selected-content-button"))
                {

                    $(e.relatedTarget).click();
                    event.focus();
                }
                else
                    $(".mel-select-popup").remove();
            });

            this.tmp_popup = {
                options:options,
                options_class:options_class,
                event:event,
                is_icon:is_icon,
                onchange:onchange
            };

            return this;

        }

        /**
         * Met à jour la valeur du select
         * @param {string} value Nouvelle valeur
         * @param {string} newTitle Nouveau titre associé
         * @returns {Mel_Elastic} Chaînage
         */
        updateSelectValue(value, newTitle = "")
        {
            //console.log("generateSelect", value);
            if (this.tmp_popup !== undefined)
            {
                if (this.tmp_popup.event.data("value") === value)
                {
                    $(".mel-select-popup").remove();
                    delete this.tmp_popup;
                    return;
                }

                this.tmp_popup.event.data("value", value).attr("title", newTitle).html((this.tmp_popup.is_icon ? ("<span class="+this.tmp_popup.options[value]+"></span>") : this.tmp_popup.options[value]));
                const options_class = this.tmp_popup.options_class;
                
                if (options_class !== null && options_class !== undefined)
                {
                    const current_option_class =  options_class[value] !== undefined ? options_class[value] : null;
                    for (const key in options_class) {
                        if (Object.hasOwnProperty.call(options_class, key)) {
                            const element = options_class[key];
                            this.tmp_popup.event.removeClass(element);
                        }
                    }
                    if (current_option_class !== null)
                        this.tmp_popup.event.addClass(current_option_class);
                }

                $(".mel-select-popup").remove();

                if (this.tmp_popup.onchange !== null && this.tmp_popup.onchange !== undefined)
                {
                    if (this.tmp_popup.onchange.includes("<value/>"))
                        this.tmp_popup.onchange = this.tmp_popup.onchange.replaceAll("<value/>", value);
                    
                        if (this.tmp_popup.onchange.includes("MEL_ELASTIC_UI.SELECT_VALUE_REPLACE"))
                        this.tmp_popup.onchange = this.tmp_popup.onchange.replaceAll("MEL_ELASTIC_UI.SELECT_VALUE_REPLACE", "`" + value + "`");

                    eval(this.tmp_popup.onchange);
                }

                delete this.tmp_popup;
            }

            return this;
        }
        
        /**
         * Modifie la valeur d'un select
         * @param {string} new_value Nouvelle valeur
         * @param {JQUERY} event Élément JQUERY
         * @returns {Mel_Elastic} Chaînage
         */
        setValue(new_value, event)
        {
            const options = typeof event.data("options") === "string" ? JSON.parse(event.data("options").includes("¤¤¤") ? event.data("options").replaceAll('¤¤¤', '"') : event.data("options")) : event.data("options");
            const options_class = typeof event.data("options_class") === "string" ? JSON.parse(event.data("options_class").includes("¤¤¤") ? event.data("options_class").replaceAll('¤¤¤', '"') : event.data("options_class")) : event.data("options_class");
            const update = event.data("event");
            const is_icon = typeof event.data("is_icon") === "string" ? event.data("is_icon") === "true" : event.data("is_icon");
            const value = event.data("value");
            const onchange = event.data("onchange");

            this.tmp_popup = {
                options:options,
                options_class:options_class,
                event:event,
                is_icon:is_icon,
                onchange:onchange
            };
            this.updateSelectValue(new_value);

            return this;
        }

        ////////////************* Tab functions *************///////////
        /**
         * Change d'onglet
         * @param {DOMElement} event 
         * @returns {Mel_Elastic} Chaînage
         */
        switchTab(event)
        {
            //get id
            const id = event.id;
            //get namespace (tab-)
            let namespace = null;

            $(event).each((i, e) => {
                for (let index = 0; index < e.classList.length; ++index) {
                    const element = e.classList[index];
                    if (element.includes("tab-"))
                    {
                        namespace = element;
                        break;
                    }
                }
            });

            if (namespace === null)
                return this;

            //Désactivation des autres tabs et objets
            $("."+namespace+".mel-tab").removeClass("active").attr("aria-selected", false).attr("tabindex", -1);
            $("."+namespace+".mel-tab-content").css("display", "none");

            //Activation de la tab
            $(event).addClass("active").attr("aria-selected", true).attr("tabindex", 0);

            //activation des objets lié à la tab
            $("." + id + "." + namespace).css("display", "");
            const onclick = $(event).data("onclick");

            if (onclick !== null && onclick !== undefined && onclick !== "")
            {
                new Promise((a,b) => {
                    try {
                        eval(onclick);
                    } catch (error) {
                        console.error(error);
                    }

                    if ($(event).data("delete-after-click") === true)
                        $(event).data("onclick", "");
                });
            }

            return this;

        }

        /**
         * Gère les différents onglets
         * @param {JQUERY | DOMElement} $item Si null, gère la page entière 
         * @returns {Mel_Elastic} Chaînage
         */
        gestionTabs($item = null)
        {
            if ($item === null)
            {
                const items = document.querySelectorAll('[role="tablist"]');
                for (let index = 0; index < items.length; ++index) {
                    const element = items[index];
                    this.gestionTabs(element);
                }
            }
            else {
                const determineDelay = function () {
                    var hasDelay = tablist.hasAttribute('data-delay');
                    var delay = 0;
                
                    if (hasDelay) {
                      var delayValue = tablist.getAttribute('data-delay');
                      if (delayValue) {
                        delay = delayValue;
                      }
                      else {
                        // If no value is specified, default to 300ms
                        delay = 300;
                      };
                    };
                
                    return delay;
                  };

                let item = $($item);

                if (item.hasClass("mel-ui-tab-system"))
                  return this;
                else
                    item.addClass("mel-ui-tab-system");

                let tabs = item.find("button");

                tabs.keydown( (event) => {
                    const key = event.keyCode;

                    let direction = 0;
                    switch (key) {
                        case this.keys.left:
                            direction = -1;
                            break;
                        case this.keys.right:
                            direction = 1;
                            break;

                        case this.keys.home:
                            $(tabs[0]).focus().click();
                            break;
                        case this.keys.end:
                            $(tabs[tabs.length-1]).focus().click();
                            break;
                    
                        default:
                            break;
                    }

                    if (direction !== 0)
                    {
                        for (let index = 0; index < tabs.length; ++index) {
                            const element = $(tabs[index]);
                            
                            if (element.hasClass("selected") || element.hasClass("active"))
                            {
                                let id;
                                if (index + direction < 0)
                                    id = tabs.length - 1;
                                else if (index + direction >= tabs.length)
                                    id = 0;
                                else
                                    id = index + direction;

                                $(tabs[id]).focus().click();

                                break;
                            }
                        }
                    }
                });
                
            }

            return this;
        }

        ////////////************* Pagination functions *************///////////
        /**
         * Créer un html pour le nombre de la pagination
         * @param {number} number Nombre
         * @param {boolean} isClickable Si le nombre est clickable
         * @param {boolean} active Si le nombre est actif
         * @returns {string} HTML
         */
        create_number(number, isClickable = true, active = false) {
            return `<span class="pagination-number pagination-number-`+number.toString().replaceAll(".", "a")+(active ? " active " : "")+(isClickable ? "" : "disabled")+`" onclick="MEL_ELASTIC_UI.pagination_page(this, `+number+`)">` + number + '</span>';
        };

        /**
         * Créer une barre de pagination
         * @param {DomElement} e Element qui contiendra la pagination 
         * @param {number} count Nombre d'éléments
         * @param {number} current Elément courant
         * @returns {Mel_Elastic} Chaînage
         */
        set_pagination(e,count, current = null)
        {
            const _integer = this._integer;
            //console.log("count", count);
            count = Math.ceil(count/7.0);
            e.html('<button class="pagination_prev pagination-button" onclick="MEL_ELASTIC_UI.pagination_prev(this)">Précédent</button>')
            e.append("<div class=pagination-elements></div>");
            let pagination_elements = e.find(".pagination-elements");
            for (let index = 0; index < count; ++index) {
                if (index === _integer){
                    pagination_elements.append(this.create_number("...", false));
                    pagination_elements.append(this.create_number(count));
                    break;
                }
                else
                pagination_elements.append(this.create_number(index+1, true, (index === 0)));
            }
            e.append('<button class="pagination_next pagination-button" onclick="MEL_ELASTIC_UI.pagination_next(this)">Suivant</button>')
            //console.log("current", current);
            if (current !== null)
                this.pagination_page($(".pagination-number-" + current)[0],current, false);

            return this;
        }

        /**
         * Change de page spécifiquement
         * @param {JQUERY} e Elément cliqué 
         * @param {number} number Page
         * @param {boolean} doAction Si on effectue l'action ou non.
         * @returns {Mel_Elastic} Chaînage
         */
        pagination_page(e, number, doAction = true){
            const _integer = this._integer;
            e = $(e).parent();
            const count = Math.ceil(e.parent().data("count")/7.0);
            let html = "";

            if (count > _integer)
            {
                let before = false;
                let after = false;
                for (let index = 0; index < count; ++index) {
                    //affichage du premier
                    if (index === 0)
                        html += this.create_number(index+1, true, (index+1 === number));
                    //affichage du dernier
                    else if (index === count - 1)
                    html += this.create_number(count, true, number === count)
                    //si loin premier et loin dernier
                    else if (number  > _integer && number < (count - _integer))
                    {
                        if (index < number - _integer / 2.0)// || index > number + _integer / 2.0)
                        {
                            if (!before){
                                html += this.create_number("...", false);
                                before = true;
                            }
                        }
                        else if (index > number + _integer / 2.0)
                        {
                            if (!after)
                            {
                                html += this.create_number("...", false);
                                after = true;
                            }
                        }
                        else
                            html += this.create_number(index + 1, true, (index+1 === number));
                    }
                    //si proche premier
                    else if (number < _integer)
                    {
                        if (index === _integer){
                            html += this.create_number("...", false);
                            html += this.create_number(count);
                            break;
                        }
                        else
                            html += this.create_number(index + 1);
                    }
                    //si proche dernier
                    else
                    {
                        if (index > count - _integer)
                            html += this.create_number(index + 1);
                        else{
                            if (!before)
                            {
                                html += this.create_number("...", false);
                                before = true;
                            }
                        }
                    }
                }
            }
            else
            {
                for (let index = 0; index < count; ++index) {
                    //console.log("test", index+1 === number);
                    html += this.create_number(index+1, true, (index+1 === number));
                }
            }
            e.html(html);
            e.parent().data("current", number);
 
            if (doAction)
                eval(e.parent().data("page").replaceAll("¤page¤", number));

            return this;
        }

        /**
         * On affiche la page suivante
         * @param {DOMElement} e Element cliqué
         * @returns {Mel_Elastic} Chaînage
         */
        pagination_next(e) {
            const count = $(e).parent().data("count");
            let current = $(e).parent().data("current");
            current = (current === null || current === undefined ? 2 : current + 1);

            if (count+1 != current)
                this.pagination_page($(".pagination-number-" + current)[0], current)

            return this;
        }

        /**
         * On affiche la page précédente
         * @param {DOMElement} e Element cliqué
         * @returns {Mel_Elastic} Chaînage
         */
        pagination_prev(e) {
            const current = $(e).parent().data("current");

            if (current !== undefined || current !== 1)
                this.pagination_page($(".pagination-number-" + (current-1))[0], current - 1);

            return this;
        }

        initResponsive(key = null, changeReturn = false)
        {
            const each = ($tn, tn, t, d, ptl, namespace) => {
                const $tabName = $tn;//$(e).find('.rTabName');
                const tabName = tn;//$(e).data('tab-name');
                const tab = t;//$(e).data('selector-tab');
                const _default = d;//$(e).data('is-default-tab');
                const parentTabList = ptl;//$(e).data('parent-tabs');

                const item = {
                    $tabName:($tabName.length === 0 ? tabName:$tabName),
                    $tab:$(tab),
                    default:_default,
                    $parentTabList:$(parentTabList),
                    isTabNameString() {
                        return typeof this.$tabName === 'string';
                    }
                };

                return this.initTabResponsive(namespace, item);
            }

            const tab_class = 'mel-responsive-tab';
            const tab_header_class = 'mel-responsive-tabheader';
            const tab_content = 'mel-responsive-tab-content';

            if (!key && rcmail.env.task === 'bureau')
            {
                const namespace = 'namespace-reponsive-tab-desk';
                if ($(`.${namespace}`).length === 0)
                {
                    $('.module_parent').each((i,e) => {
                        e = $(e);
                        each(
                            e.find('h2').first(),
                            '',
                            e,
                            i === 0,
                            '#contents',
                            namespace
                        );
                    });
                    $('#contents').find(`.${tab_class}.${tab_header_class}`).last().addClass('last');
                }

            }
            else {
                let namespace = null;

                switch (key) {
                    case 'shortcut':
                        namespace = 'namespace-reponsive-tab-' + key;
                        break;
                
                    default:
                        break;
                }

                let $querry = $(`.${tab_content}${(!!namespace ? `.${namespace}` : '')}`);

                if ($querry.length === 0) $querry = $(`.${tab_content}.no-namespace`);

                const size = $querry.length - 1;

                $(`.${tab_content}${(!!namespace ? `.${namespace}` : '')}`).each((i, e) => {
                    let $tab = each(
                        $(e).find('.responsive-tab-name'),
                        $(e).data('tab-name'),
                        $(e).data('selector-tab'),
                        $(e).data('is-default-tab'),
                        $(e).data('parent-tabs'),
                        namespace ?? $(e).parent().data('namespace') ?? 'no-namespace'
                    );

                    if (!!$tab && $tab.length > 0 && i === size) $tab.addClass('last');
                    
                });
            }

            rcmail.addEventListener("skin-resize", (datas) => { 
                const small = 'small';
                const phone = 'phone';
                //const header_to_hide = 'mel-header-to-hidden';
                const hide_button = 'responsive-hide-button';
                const tab_list = 'responsiveTabList';
                const selected_item_class = 'selected';
                // const tab_content = 'mel-responsive-tab-content';
                datas = datas.mode;

                if (datas === small) datas = phone;

                if (this.screen_type !== (datas ?? this.screen_type))
                {
                    if ((this.screen_type !== phone && this.screen_type !== small) && (datas === phone || datas === small)) //On passe en mode phone
                    {
                        $(`.${tab_list}`)
                        .css('display', '')
                        .find(`.${selected_item_class}`)
                        .click();

                        if (rcmail.env.task === "bureau")
                        {
                            $("#welcome-text").find('.col-3')
                            .css('display', 'none')
                            .parent().find('.col-6').first()
                            .removeClass('col-6').addClass('col-12').children()
                            .css('font-size','30px')
                            .css('margin-top', 0);
                        }
                    }
                    else {
                        $(`.${tab_list}`)
                        .css('display', 'none')
                        .find(`.${hide_button}`)
                        .click();

                        if (rcmail.env.task === "bureau")
                        {
                            $("#welcome-text").find('.col-3')
                            .css('display', '')
                            .parent().find('.col-12').first()
                            .removeClass('col-12').addClass('col-6').children()
                            .css('font-size','40px')
                            .css('margin-top','55px');
                        }
                    }

                    this.screen_type = datas ?? this.screen_type;
                }
            });

            if (!changeReturn) return this;
            else{
                const screen_type = this.screen_type;
                const update_screen_type = (x) => {
                    this.screen_type = x;
                };
                return {
                    update() {
                        const tab_list = 'responsiveTabList';
                        const selected_item_class = 'selected';
                        const last = screen_type;
                        update_screen_type(null);
                        rcmail.triggerEvent('skin-resize', {mode:last});

                        if (last === 'small' || last === 'phone') 
                            $(`.${tab_list}`)
                            .css('display', '')
                            .find(`.${selected_item_class}`)
                            .click();
                    }
                };
            }
        }

        initTabResponsive(namespace, item = {isTabNameString:() => {return true;},$parentTabList:$(), $tabName:$(), $tab:$(), default:false})
        {
            const header_to_hide = 'mel-header-to-hidden';
            const hide_button = 'responsive-hide-button';
            const tab_list = 'responsiveTabList';
            const selected_item_class = 'selected';
            const tab_class = 'mel-responsive-tab';
            const tab_header_class = 'mel-responsive-tabheader';
            const tab_content = 'mel-responsive-tab-content';

            let tabName = '';
            let $tab = null;

            //Gestion de l'onglet
            if (!item.isTabNameString() && item.$tab.find(item.$tabName).length > 0) //Si est à l'intérieur du corps
            {
                tabName = item.$tabName.html();
                item.$tabName.addClass(header_to_hide);
            }
            else tabName = item.$tabName; //Si c'est juste le nom

            //Id généré depuis son nom
            const tab_id = 'responsive-generated-' + tabName.replace(/[^0-9a-z]/gi, '').toLowerCase();

            let $tabList = item.$parentTabList.find(`.${tab_list}.${namespace}`);

            //Création de la liste d'onglet si elle n'éxiste pas
            if ($tabList.length === 0)
            {
                $tabList = item.$parentTabList
                .prepend(`<div class='row ${tab_list} ${namespace}' data-namespace="${namespace}" style="flex-wrap: nowrap;"></div>`)
                .find(`.${tab_list}.${namespace}`);
            }

            //Ajout du bouton si il n'éxiste pas
            $tab = $tabList.find(`#${tab_id}`);
            if ($tab.length === 0)
            {
                $tab = $tabList.append($(`
                    <button id="${tab_id}" class="${(item.default ? selected_item_class : '')} ${tab_class} ${tab_header_class} ${namespace}">${tabName}</button>
                `).click(() => {
                    $(`.${header_to_hide}`).css('display', 'none');
                    $(`.${tab_content}.${namespace}`).css('display', 'none');
                    $(`.${tab_class}.${tab_header_class}.${selected_item_class}.${namespace}`).removeClass(selected_item_class);
                    item.$tab.css('display', '');
                    $(`#${tab_id}`).addClass(selected_item_class);
                })
                ).find(`#${tab_id}`);
            }

            //Création du bouton de "désaffichage"
            if ($tabList.find(`.${hide_button}`).length === 0)
            {
                $tabList.append(`<button class="${hide_button} ${namespace} hidden"></button>`);
            }

            $tabList.find(`.${hide_button}.${namespace}`).click(() => {
                item.$tab.css('display', '');

                //if (!item.isTabNameString() && item.$tab.find(item.$tabName).length > 0) item.$tabName.css('display', '');
                $(`.${header_to_hide}`).css('display', '');
            });

            item.$tab.addClass(tab_content).addClass(namespace);

            return $tab;
        }

        get_current_theme() {
            return this.theme || 'default';
        }

        get_current_theme_picture()
        {
            return this.get_themes()[this.get_current_theme()];
        }

        update_theme(theme)
        {
            theme = theme || 'default'
            if (theme !== this.theme) {
                let $html = $('html');
                
                if (this.theme !== 'default') $html.removeClass(`theme-${this.theme.toLowerCase()}`);
                if (theme !== 'default') $('html').addClass(`theme-${theme.toLowerCase()}`);

                this.theme = theme;
            }

            $('iframe.mm-frame').each((i, e) => {
                try {
                        e.contentWindow.MEL_ELASTIC_UI.update_theme(theme);
                } catch (error) {
                    
                }
            });

            return this;
        }

        get_themes(){
            return this.themes || [];
        }

    }

    /**
     * Contient les fonctions de la classe Mel_Elastic
     */
    window.MEL_ELASTIC_UI = new Mel_Elastic();
    window.mel_deploy_undeploy = (e, selector) => {
        e = $(e);
        if (e.css('display') !== 'none')
        {
            e.css('display', 'none');
            $(selector).css('display', '');
        }
        else {
            e.css('display', '');
            $(selector).css('display', 'none');
        }
    };

});
