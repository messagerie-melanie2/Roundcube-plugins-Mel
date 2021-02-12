function main_flux_rss()
{
    let config = rcmail.env.flux_rss_config;
    console.log(config);
    let tmp;
    let html;
    let htmlContent;
    let url;
    for (const key in config) {
        if (Object.hasOwnProperty.call(config, key)) {
            const element = config[key];
            html = "";
            $("#rss-title-id-" + key).html(rcmail.gettext(element.title, 'mel_portal'));
            //console.log(element);
            for (let index = 0; index < element.tabs.length; index++) {
                const tab = element.tabs[index];
                //console.log(tab);
                if (element.showTabs)
                    html += '<button class="btn btn-secondary tabrss ' + (index == 0 ? "selected" : "") + '" onclick="rss_OnClick(this, `' + 'ev-' + key + '-' + index + '`,`rss-master-id-' + key + '`)">' + rcmail.gettext(tab.name, 'mel_portal') + '</button>'
                htmlContent = '<datas data-id="'+key+'" data-tab="'+tab.name+'" id="dt-ev-' + key + "-" + index + '"></datas><div class="row ' + (index == 0 ? "" : "hidden") + '" id=ev-' + key + "-" + index + '>';
                for (let it = 0; it < tab.items.length; it++) {
                    const item = tab.items[it];
                   // console.log(item, item.color);
                    htmlContent += `<div class=` + (item.size.size == 1 ? 'col-md-3' : 'col-md-6') + `>`;
                    htmlContent += rcmail.env.flux_rss_html_block.replace(/rss_title/g, '')
                    .replace(/rss_header/, "rss-header-" + 'ev-' + key + '-' + index + '-' + it)
                    .replace(/rss_body/, "rss-body-" + 'ev-' + key + '-' + index + '-' + it)
                    .replace(/rss_footer/, "rss-footer-" + 'ev-' + key + '-' + index + '-' + it)
                    .replace('class="contents', 'class="contents ' + item.color + '"');
                    //console.log(htmlContent);
                    htmlContent += '</div>';
                    url = item.url/*.replace(new RegExp("http://"), "")
                    .replace(new RegExp("https://"), "")
                    .replace(/\//g, ".") + ".xml"*/;
                    url = rcmail.url("fluxrss", "_file="+url);
                    //console.log(url);
                    tmp = new fluxrss("ev-" + key + '-' + index + '-' + it, url, {
                        header:"rss-header",
                        body:"rss-body",
                        footer:"rss-footer"
                    });
                    tmp.init();
                    
                }
                htmlContent += "</div>";
                $("#rss-contents-id-" + key).append(htmlContent);
            }
            $("#rss-header-id-" + key).html(html);

        }
    }

    $(".rss-header").each(function (i,e) {
        //console.log($("#"+e.id).parent());
        let tmp = rcmail.env.button_add.replace("¤¤¤", "rss_AddFlux(" + $("#"+e.id).parent().find("datas").data("id") + ")");
        if (e.innerHTML !== "")
            $("#"+e.id).append(tmp);
        else
            $("#"+e.id).parent().find(".rss-title").append(tmp);
    });

}

Main.Add(main_flux_rss);

function rss_OnClick(element, id, masterId)
{
    $("#" + masterId + " .rss-header .tabrss").each((i,e) => {
		e.classList.remove("selected");
	  });
	  $("#" + masterId + " .rss-contents .row").each((i,e) => {
		e.classList.add("hidden");
	  });

	  element.classList.add("selected");
	  $("#" + id).removeClass("hidden");
	  setTimeout(() => {
		document.activeElement.blur();
	  }, 100);
}

function rss_send_new_flux()
{
    rss_popUp.send();
}

function rss_AddFlux(id)
{
    if (window.rss_popUp === undefined)
    {
        let config = new GlobalModalConfig("Ajouter un flux", "default", rcmail.env.flux_rss_form, " ");
        rss_popUp = new GlobalModal("globalModal", config, true);
        // rss_popUp.id = id;
        $("#rss-form-key").val(id);
        $("#rdd-form-tab").val($("#rss-header-id-"+id).find(".selected").html());
        // rss_popUp.setTopPosition("60px");
        // rss_popUp.modal.css("overflow", "visible");
        rss_popUp.modal.find(".square-body").css("overflow", "initial");
        rss_popUp.header.title.addClass("rss-modal-title");
        rss_popUp.footer = $("#rss-t-add-button");
        rss_popUp.footer.html(rcmail.env.button_add.replace("mel-add", "mel-add left").replace("¤¤¤", "rss_send_new_flux()"));
        rss_popUp.send = function() {
            $("#rss-submit-form").click();
        }
    }
    else 
    {
        $("#rss-form-key").val(id);
        $("#rdd-form-tab").val($("#rss-header-id-"+id).find(".selected").html());
        rss_popUp.show();
    }

}