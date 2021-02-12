function mm_s_Action(e)
{
    const replaced = rcmail.env.REPLACED_SEARCH;
    //console.log(e);
    let val = e.value;
    let config = rcmail.env.mm_search_config;
    $(".search-container").html("");
    if (val === "")
    {
        $("#barup-search").addClass("hidden");
        $("body").unbind("click");
        return;
    }
    //rcmail.display_message("Recherche en cours....", "loading")
    for (let index = 0; index < config.length; ++index) {
        const element = config[index];
       // mm_s_array.push({index:index,ajax:
        $.ajax({ // fonction permettant de faire de l'ajax
        type: "GET", // methode de transmission des données au fichier php
        url: element.replace(replaced, val), // url du fichier php
        dataType: 'json',
        success: function (data) {
            //console.log(Array.isArray(data), data.length > 0 , data[0].calendar !== undefined);
             if (Array.isArray(data) && data.length > 0 && data[0].calendar !== undefined)
                data = SearchResultCalendar.from_array(data);
            //console.log("datas", data);
            if (data.datas.length > 0)
                mm_s_AfficheResults(data);
        },
        error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
 
        },
     });//});
    }
    if (jQuery._data($("body")[0], 'events')["click"] === undefined)
        $("body").click(mm_s_bodyClick);
}

function mm_s_bodyClick(event)
{
    let querry = $("#barup-search");
    if (querry.hasClass("hidden"))
        return;
    let target = event.target;
    //console.log(target.id);
    while (target.id !== "layout") {
        //console.log("target",target.id, target,target.id === "barup-search",target.id === "barup" );
        if (target.id === "barup-search" || target.classList.contains("barup"))
            return;
        else
            target = target.parentElement;
    }
    if (!querry.hasClass("hidden"))
        querry.addClass("hidden");

}


function mm_s_OnClick()
{
    //console.log($(".search-container").html() !== "");
    if ($(".search-container").html() !== "")
    {
        let querry = $("#barup-search");
        if (querry.hasClass("hidden"))
            querry.removeClass("hidden");
    }
}

function mm_s_AfficheResults(datas)
{
    let querry = $("#barup-search");
    if (querry.hasClass("hidden"))
        querry.removeClass("hidden");
    html = '<div class=search-parent><div class=search-label onclick="mm_s_extend(this)"><span class="icofont-rounded-down"></span><span class=result-label>' + datas.label + '</span></div><div>';
    html += '<table class="table table-striped">'
    let isa;
    for (let index = 0; index < datas.datas.length; index++) {
        const element = datas.datas[index];
        //console.log(element.sub_header);
        isa = element.link === "" ? "span" : "a";
        html += '<tr><td><' + isa + ' href="'+ element.link + '"' + (element.onclick !== undefined ? (' onclick="' + element.onclick + '" ') : "") +' class="result-link"><div class="result-header">' + element.header + '</div><div class="result-desc">' + element.sub_header + '</div></' + isa + '></td></tr>'
    }
    html += "</table></div></div>";
    $(".search-container").append(html);
}

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
    cal = JSON.parse(cal.replace(/£¤£/g, '"'));
    rcmail.local_storage_set_item("calendar_redirect", cal);
    window.location.href = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
}

/*
rcmail.display_message("test", "error") / rcmail.display_message("test", "confirmation") / loading






*/