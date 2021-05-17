$(document).ready(() => {
    if (parent === window)
    {
        //La sidebar étant en position absolue, on décale certaines divs pour que l'affichage soit correct.
        const width = "60px";
        if ($("#layout-sidebar").length > 0)
            $("#layout-sidebar").css("margin-left", width);
        else if ($("#layout-content").length > 0)
            $("#layout-content").css("margin-left", width);
    }

    class Mel_Elastic {
        constructor() {
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
              this.update();
              if (rcmail.env.task == 'login' || rcmail.env.task == 'logout') 
                $('#rcmloginsubmit').val("Se connecter").html("Se connecter");
              $("#taskmenu").find("a").each(async (i,e) => {
                e = $(e);
                if (e.parent().hasClass("special-buttons"))
                    return;
                const tmp = e.removeAttr("title")[0].outerHTML;
                e.remove();
                e = null;
                $(tmp).keypress((event) => {
                    if (event.originalEvent.keyCode === 32)
                        $(event.currentTarget).click();
                }).appendTo($("#taskmenu"));
              });
        }
        update()
        {
            $(".mel-tabheader").unbind('click');
            $(".mel-tabheader").on("click", (e) => {
                //console.log("MEL_ELASTIC", this, e);
                this.switchTab(e.currentTarget);
            })

            $(".select-button-mel").unbind('click');
            $(".select-button-mel").on("click", (e) => {
                this.generateSelect(e.currentTarget);
            });
            console.log("pagination", $(".pagination"));
            $(".pagination").each((i,e) => {
                e = $(e);
                this.set_pagination(e, e.data("count"), e.data("current") === undefined ? null : e.data("current"));
                return this;
            });
            //$(".input-mel-datetime").after("")
            
        }
        getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        getRect(rect1, rect2)
        {
            return {
                top:rect1.top-rect2.top,
                left:rect1.left-rect2.left,
                right:rect1.right-rect2.right,
                bottom:rect1.bottom-rect2.bottom,
                rect1:rect1,
                rect2:rect2
            };
        }
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
                    html += '<button onclick="MEL_ELASTIC_UI.updateSelectValue(`'+key+'`)" class="'+current_option_class+' mel-selected-content-button btn btn-primary '+(value === key ? "active" : "")+'">'+(is_icon ? ("<span class="+element+"></span>") : element)+'</button>'
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
                console.log("generateSelect",e);
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
            // $(document).on("click", (e) => {
            //     console.log("generateSelect", e, event[0], e.currentTarget === event[0] || $(e.currentTarget).hasClass("mel-select-popup"));
            //     if (e.currentTarget === event[0] || $(e.currentTarget).hasClass("mel-select-popup"))
            //         return;
            //     else {
            //         $(".mel-select-popup").remove();
            //     }
            // });
        }
        updateSelectValue(value)
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
                this.tmp_popup.event.data("value", value).html((this.tmp_popup.is_icon ? ("<span class="+this.tmp_popup.options[value]+"></span>") : this.tmp_popup.options[value]));
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
                    //console.log('generateSelect', this.tmp_popup.onchange);
                    eval(this.tmp_popup.onchange);
                }
                delete this.tmp_popup;
            }
        }
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
        }
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
                return;
            //Désactivation des autres tabs et objets
            $("."+namespace+".mel-tab").removeClass("active");
            $("."+namespace+".mel-tab-content").css("display", "none");
            //Activation de la tab
            $(event).addClass("active");
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
                    //console.log("fdmfd,fdmkmfdfd", $(event).data("delete-after-click"), $(event).data("onclick"), event, $(event));
                    if ($(event).data("delete-after-click") === true)
                        $(event).data("onclick", "");
                });
            }

        }
        url(task, action = "", args = null)
        {
            if (mel_metapage !== undefined)
                return mel_metapage.Functions.url(task, action, args);
            else
            {

                let tmp = "";
                if (action !== "")
                    tmp += "&_action=" + action;
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = object[key];
                        tmp += "&" + key + "=" + element;
                    }
                }
                return rcmail.get_task_url((task + tmp), window.location.origin + window.location.pathname);
            }    
        }
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
		    html += `<a href="#add-contact" onclick="m_mp_openTo()" class="input-group-text icon add recipient" title="Ajouter un contact" tabindex="1"><span class="inner">Ajouter un contact</span></a>`;
			html +=	'			</span>';
			html += '			</div>';
            return html;
        }
        create_number(number, isClickable = true, active = false) {
            return `<span class="pagination-number pagination-number-`+number.toString().replaceAll(".", "a")+(active ? " active " : "")+(isClickable ? "" : "disabled")+`" onclick="MEL_ELASTIC_UI.pagination_page(this, `+number+`)">` + number + '</span>';
        };
        set_pagination(e,count, current = null)
        {
            const _integer = this._integer;
            console.log("count", count);
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
            console.log("current", current);
            if (current !== null)
                this.pagination_page($(".pagination-number-" + current)[0],current, false);
        }
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
                    console.log("test", index+1 === number);
                    html += this.create_number(index+1, true, (index+1 === number));
                }
            }
            e.html(html);
            e.parent().data("current", number);
            //console.log((e.parent().data("page").replaceAll("¤page¤", number)));
            if (doAction)
                eval(e.parent().data("page").replaceAll("¤page¤", number));
        }
        pagination_next(e) {
            const count = $(e).parent().data("count");
            let current = $(e).parent().data("current");
            current = (current === null || current === undefined ? 2 : current + 1);
            if (count+1 != current)
                this.pagination_page($(".pagination-number-" + current)[0], current)
        }
        pagination_prev(e) {
            const current = $(e).parent().data("current");
            if (current !== undefined || current !== 1)
                this.pagination_page($(".pagination-number-" + (current-1))[0], current - 1);
        }

    }

    window.MEL_ELASTIC_UI = new Mel_Elastic();


});

// function rc_url(task, action = "", args = null)
// {

// }

