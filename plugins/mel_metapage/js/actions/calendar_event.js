$(document).ready(
    function ()
    {
        CalendarPageInit();
        rcmail.addEventListener("init", () => {
            rcmail.addEventListener('responsebefore', function(props) {
                const action = "update_cal";

                if (props.response && props.response.action == 'event') {
                    mel_metapage.Functions.call(action, false, {
                        _integrated:true,
                        eval:"always",
                        args:{
                            child:true,
                            goToTop:true
                        }
                    });
                    
                }
                else if (props.response && (props.response.action === "mailimportitip" || props.response.action === "itip-delegate" || props.response.action === "itip-remove"))
                {
                    let config = {
                        _integrated:true,
                        eval:"always",
                        args:{
                            refresh:true,
                            child:true,
                            goToTop:true
                        }
                    };

                    if (window.mel_metapage !== undefined)
                        mel_metapage.Functions.call(action, false, config);
                    else
                    {
                        config["exec"] = action;
                        config["child"] = false;
                        parent.postMessage(config);
                    }
                    
                }
    
            });

            parent.metapage_frames.addEvent("open.after", async (eClass, changepage, isAriane, querry, id, actions) => {
            
                if (eClass === "calendar")
                {
                    querry = $(`iframe#${id}`);
                    if (querry.length > 0)
                    {
                        //querry[0].contentWindow.$('#calendar').fullCalendar( 'refetchEvents' );
                        querry[0].contentWindow.$('#calendar').fullCalendar('rerenderEvents');
                    }
                    else
                    {
                        try {
                            //$('#calendar').fullCalendar( 'refetchEvents' );
                            $('#calendar').fullCalendar('rerenderEvents');
                        } catch (error) {
                            
                        }
                    } 
                }
            
            });

        });
    


    }  
);

function CalendarPageInit()
{
    DatePickerInit().then(() => {
        $(".ui-datepicker-inline.ui-datepicker.ui-widget.ui-widget-content.ui-helper-clearfix.ui-corner-all").on("keyup", (event) => {
            if ($.inArray(event.keyCode, [13, 33, 34, 35, 36, 37, 38, 39, 40]) != -1)
                DatePickerInit();
        });

        rcmail.addEventListener("calendar.datepicker.onChangeMonthYear", (a) => {
            DatePickerInit();
        });

        rcmail.addEventListener("calendar.datepicker.onSelect", (a) => {
            DatePickerInit();
        });

        rcmail.addEventListener("calendar.datepicker.beforeShowDay", (a) => {
            DatePickerInit();
        });


        const isSelected = (value) => {
            return $("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left .active").html() === value ? "selected" : "";
        };

        $(`<select id=calendarOptionSelect class="form-control mel-input calendar input-mel custom-select">
            <option value=day ${isSelected("Jour")}>Jour</option>
            <option value=week ${isSelected("Semaine")}>Semaine</option>
            <option value=month ${isSelected("Mois")}>Mois</option>
            <option value=ootd ${isSelected("Ordre du jour")}>Planning</option>
        </select>`)
        .on("change", () => {

            let querry = $("#calendarOptionSelect");
            const val = querry.val() === "ootd" ? "Ordre du jour" : querry.find(`option[value=${querry.val()}]`).html();

            $("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left button").removeClass("active").each((i, e) => {
                e = $(e);
                if (e.html() === val)
                    e.click();
            });
            
        })
        .appendTo($("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left"));
    });


    //$(".body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left").append()
    
}

function ForceSelectClick(element)
{
    var event;
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window);
    element.addClass("calendar-force-show")[0].dispatchEvent(event);
}

async function DatePickerInit()
{
    if (rcmail.env.task !== "calendar")
        return;

    await wait(() => {
        return $("#datepicker-dp-title").length === 0;
    });

    const idMonth = "mel-calendar-date-month";
    const idYear = "mel-calendar-date-year";

    if ($(`#${idMonth}`).length > 0)
        return;

    let querry = $("#datepicker-dp-title");
    querry.append(`<span role=button tabIndex=0 style="cursor:pointer;font-weight:normal;" class="mel-focus mel-hover" id=${idMonth}>${$(`.ui-datepicker-month option[value=${$(".ui-datepicker-month").val()}]`).html()}</span>
    <span role=button tabIndex=0 style="cursor:pointer;font-weight:normal;" class="mel-focus mel-hover" id=${idYear}>${$(`.ui-datepicker-year option[value=${$(".ui-datepicker-year").val()}]`).html()}</span>`);

    querry.find(`#${idMonth}`).click((e) => {
        ForceSelectClick($("#datepicker-dp-title .ui-datepicker-month"));
    })
    .on("keydown", (event) => {
        if (event.keyCode === 32 || event.keyCode === 13)
            ForceSelectClick($("#datepicker-dp-title .ui-datepicker-month"));
    })
    .parent()
    .find(`#${idYear}`)
    .click(() => {
        ForceSelectClick($("#datepicker-dp-title .ui-datepicker-year"));
    })
    .on("keydown", (event) => {
        if (event.keyCode === 32 || event.keyCode === 13)
            ForceSelectClick($("#datepicker-dp-title .ui-datepicker-year"));
    });

    $("#datepicker-dp-title .ui-datepicker-month").on("focusout", () => {
        $("#datepicker-dp-title .ui-datepicker-month").removeClass("calendar-force-show");
    })
    .on("change", () => {
        DatePickerInit();
    });

    
    $("#datepicker-dp-title .ui-datepicker-year").on("focusout", () => {
        $("#datepicker-dp-title .ui-datepicker-year").removeClass("calendar-force-show");
    })
    .on("change", () => {
        DatePickerInit();
    });

    $('.ui-datepicker-next').click(() => {
        DatePickerInit();
    })

    $('.ui-datepicker-prev').click(() => {
        DatePickerInit();
    })
}

function search_action(searchValue)
{
    const timeoutValue = 111;
    setTimeout(async () => {
        await wait(() => rcmail.busy);
        $("#searchform").val(searchValue).parent().submit();
    }, timeoutValue);
}