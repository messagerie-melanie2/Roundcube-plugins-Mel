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
            $(".mel-tabheader").on("click", (e) => {
                //console.log("MEL_ELASTIC", this, e);
                this.switchTab(e.currentTarget);
            })
        }
        getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
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
    }
    

    window.MEL_ELASTIC_UI = new Mel_Elastic();

});

// function rc_url(task, action = "", args = null)
// {

// }

