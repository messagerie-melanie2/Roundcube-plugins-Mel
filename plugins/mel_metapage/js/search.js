/**
 * Action à faire lorsque l'on a tapé un texte dans la recherche.
 * @param {*} e Input recherche
 */
function mm_s_Action(e)
{
    const replaced = rcmail.env.REPLACED_SEARCH;
    let val = e.value;
    let config = rcmail.env.mm_search_config;
    $(".search-container").html("");

    if (val === "")
    {
        $("#barup-search").addClass("hidden");
        $("#barup-search-background").addClass("hidden");
        $("body").unbind("click");
        return;
    }

    let search_icon = $("#barup-search-col .icofont-search").removeClass("icofont-search").html('<span class="spinner-grow spinner-grow-sm" role="status"><span class="sr-only">Chargement des informations...</span></span>');


    rcmail.env.mel_metapage_search = {
        size:config.length,
        finished:[],
        timeout: function () {

            if (rcmail.env.mel_metapage_search.size === rcmail.env.mel_metapage_search.finished.length)
            {
                rcmail.env.mel_metapage_search = null;
                delete rcmail.env.mel_metapage_search

                rcmail.clear_messages();

                if (search_icon.children().hasClass("text-success"))
                {
                    rcmail.display_message("Recherche effectué avec succès !", "confirmation");

                    if ($("#barup-search").hasClass("hidden"))
                    {
                        $("#barup-search").removeClass("hidden");
                        $("#barup-search-background").removeClass("hidden");
                    }
                }
                else
                    rcmail.display_message("Aucun résultat lié à la recherche...");

                search_icon.addClass("icofont-search").html("");



            }
            else 
                setTimeout(() => {
                    rcmail.env.mel_metapage_search.timeout(); 
                }, 100);
        }
    };

    setTimeout(rcmail.env.mel_metapage_search.timeout, 100);
    //rcmail.display_message("Recherche en cours....", "loading")

    rcmail.display_message(`Recherche de contenus lié au mot clé "${val}"`, "loading");

    for (let index = 0; index < config.length; ++index) {
        const element = config[index];
       // mm_s_array.push({index:index,ajax:
        $.ajax({ // fonction permettant de faire de l'ajax
        type: "GET", // methode de transmission des données au fichier php
        url: element.replace(replaced, val), // url du fichier php
        dataType: 'json',
        success: async function (data) {
            try {
                rcmail.env.mel_metapage_search.finished.push(null);

                if (Array.isArray(data) && data.length > 0 && data[0].calendar !== undefined)
                {
                    data = await SearchResultCalendar.from_array(data);
                }
                    

                if (data.datas !== undefined && data.datas.length > 0)
                {
                    mm_s_AfficheResults(data, val);
                    search_icon.children().addClass("text-success");
                }

            } catch (error) {
                
            }
        },
        error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
 
        },
     });//});

    }

    if (!Enumerable.from(jQuery._data($("body")[0], 'events')["click"]).where(x => x.handler + "" === mm_s_bodyClick + "").any())//jQuery._data($("body")[0], 'events')["click"] === undefined)
        $("body").click(mm_s_bodyClick);
}

/**
 * Affiche ou non les résultats de recherche si il y en a.
 * @param {*} event 
 */
function mm_s_bodyClick(event)
{
    let querry = $("#barup-search");

    if (querry.hasClass("hidden"))
        return;

    let target = event.target;
    
    while (target.id !== "layout") {
        //console.log("target",target.id, target,target.id === "barup-search",target.id === "barup" );
        if (target.id === "barup-search" || target.id === "barup-search-input")
            return;
        else
            target = target.parentElement;
    }
    if (!querry.hasClass("hidden"))
    {
        querry.addClass("hidden");
        $("#barup-search-background").addClass("hidden");
    }

    

}

/**
 * Cache la recherche en cours.
 */
function mm_s_OnClick()
{
    //console.log($(".search-container").html() !== "");
    if ($(".search-container").html() !== "")
    {
        let querry = $("#barup-search");
        if (querry.hasClass("hidden"))
        {
            querry.removeClass("hidden");
            $("#barup-search-background").removeClass("hidden");
        }
    }
}

/**
 * Affiche les résultats de la recherche.
 * @param {*} datas Résultats de la recherche.
 */
function mm_s_AfficheResults(datas, searchVal)
{
    const max = 5

    let querry = $("#barup-search");

    html = '<div class=search-parent><div class=search-label onclick="mm_s_extend(this)"><span class="icofont-rounded-down"></span><span class=result-label>' + datas.label + '</span></div><div>';
    html += '<table class="table table-striped">'
    let isa;

    for (let index = 0; index < datas.datas.length; index++) {

        if (index >= max)
            break;

        const element = datas.datas[index];

        isa = element.link === "" ? "span" : "a";
        html += '<tr><td><' + isa + ' href="'+ element.link + '"' + (element.onclick !== undefined ? (' onclick="' + element.onclick + '" ') : "") +' class="result-link"><div class="result-header">' + element.header + '</div><div class="result-desc">' + element.sub_header + '</div></' + isa + '></td></tr>'
    }

    let action = "";

    switch (datas.label) {
        case rcmail.gettext("mails", "mel_metapage"):          
            action = `mm_st_OpenOrCreateFrame('mail', true, {}, [{action:'search', args:['${searchVal}']}])`;
            break;
        case rcmail.gettext('agenda', 'mel_portal'):
            action = `mm_st_OpenOrCreateFrame('calendar', true, {}, [{action:'search', args:['${searchVal}']}])`;
            break;
        case rcmail.gettext('contacts', "mel_metapage"):
            action = `mm_st_OpenOrCreateFrame('contacts', true, {}, [{action:'search', args:['${searchVal}']}])`;
            break;
        default:
            break;
    }

    if (action !== "")
    {
        html += "<tr>";
        html += "<td>";
        html += `<a href=# onclick="mm_s_HideSearch();${action};"><span class="icon-mel-plus"></span> Voir plus </a>`;
        html += "</td></tr>";
    }

    html += "</table></div></div>";
    $(".search-container").append(html);
}

/**
 * Affiche ou cache une catégorie.
 * @param {*} e Catégorie à afficher ou fermer.
 */
function mm_s_extend(e)
{
    window.temp1 = e;
    if (e.children[0].classList.contains("icofont-rounded-down"))
    {
        e.children[0].classList.remove("icofont-rounded-down");
        e.children[0].classList.add("icofont-rounded-right");
        e.parentElement.children[1].classList.add("hidden")
    }
    else {
        e.children[0].classList.add("icofont-rounded-down");
        e.children[0].classList.remove("icofont-rounded-right");
        e.parentElement.children[1].classList.remove("hidden")       
    }
}

function mm_s_Calendar(cal)
{
    try {
        cal = SearchResult.parse(cal);
    } catch (error) {
        cal = JSON.parse(cal.replace(/£¤£/g, '"'));
    }

    rcmail.local_storage_set_item("calendar_redirect", cal);
    window.location.href = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
}

function mm_s_HideSearch()
{
    $("#barup-search").addClass("hidden");
    $("#barup-search-background").addClass("hidden");
}

/**
 * Ouvre ou créer une frame.
 * @param {string} action Frame à ouvrir.
 * @param {string} url Url de la frame.
 */
function mm_s_CreateOrUpdateFrame(action, args)
{
    event.preventDefault();
    $("#barup-search").addClass("hidden");
    $("#barup-search-background").addClass("hidden");

    switch (action) {
        case "mail":
            if ($(".mail-frame").length > 0)
                $(".mail-frame").remove();
            break;
        case "contacts":
            if ($(".addressbook-frame").length > 0)
                $(".addressbook-frame").remove();
            break;
        default:
            break;
    }


    //console.log("url", url, action);
    mm_st_OpenOrCreateFrame(action, true, args);

    // rcmail.set_busy(true, "loading");
    // let querry = $("." + action + "-frame");
    // let changePage;
    // if (querry.length > 0)
    // {
    //     querry[0].src = url;
    //     if (!rcmail.busy)
    //         rcmail.set_busy(true, "loading");
    //     rcmail.env.frame_created = false;
    //     mm_st_CreateOrOpenModal(action, true);
    //     new Promise(async (a, b) => {
    //         while (rcmail.env.frame_created === false) {
    //             await delay(1000);
    //             if (!rcmail.busy)
    //                 rcmail.set_busy(true, "loading");
    //         }
    //         rcmail.set_busy(false);
    //         rcmail.clear_messages();}
    //     );
    // }
    // else {
    //     rcmail.set_busy(false);
    //     return
        // let id = mm_st_CreateOrOpenModal(action, false);
        // if (!rcmail.busy)
        //     rcmail.set_busy(true, "loading");
        // console.log("id", id, action);
        // querry = $("#" + id);
        // new Promise(async (a, b) => {
        //     while (rcmail.env.frame_created === false) {
        //         await delay(100);
        //         if (!rcmail.busy)
        //             rcmail.set_busy(true, "loading");
        //     }
        //     rcmail.env.frame_created = false;
        //     if (!rcmail.busy)
        //         rcmail.set_busy(true, "loading");
        //     querry[0].src = url;
        //     while (rcmail.env.frame_created === false) {
        //         await delay(1000);
        //     }
        //     mm_st_CreateOrOpenModal(action);
        //     rcmail.set_busy(false);
        //     rcmail.clear_messages();
        // });
    //}
}

/*
rcmail.display_message("test", "error") / rcmail.display_message("test", "confirmation") / loading






*/