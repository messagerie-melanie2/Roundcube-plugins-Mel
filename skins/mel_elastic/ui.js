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
    }
    

    window.MEL_ELASTIC_UI = new Mel_Elastic();

});

// function rc_url(task, action = "", args = null)
// {

// }

