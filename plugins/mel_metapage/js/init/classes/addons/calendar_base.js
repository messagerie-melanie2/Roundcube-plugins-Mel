$(document).ready(() => {


    console.log("parasitage", window.rcube_calendar_ui);
    if (window.rcube_calendar_ui === undefined)
    window.rcube_calendar_ui = () => {};
    window.rcube_calendar_ui.continue = function()
    {
        // $("#event-panel-summary").css("display", "none");
        // $("#event-panel-attendees").css("display", "");
        $(".nav-link.nav-icon.attendees").click();
        if ($("#wsp-event-all-cal-mm").val() !== "#none" && $("#wsp-event-all-cal-mm").val() !== "")
            $(".have-workspace").css("display", "");
        else
            $(".have-workspace").css("display", "none");
    }
    window.rcube_calendar_ui.back = function()
    {
        $($("#eventedit").find(".nav.nav-tabs").find(".nav-link")[0]).click();
    }
    rcube_calendar_ui.save = function()
    {
        let querry = $("#eventedit").parent().parent().find(".ui-dialog-buttonset").find(".save.mainaction");
        
        if (querry.length > 0)
            querry.click();
        else
        {
            rcmail.command('event-save');
        }
    }
    window.rcube_calendar_ui.edit = function(event)
    {
        if (event === "" && rcmail.env.event_prop !== undefined)
        {
            event = rcmail.env.event_prop;
            if (typeof event.start === "string")
                event.start = moment(event.start);
            else if (event.start === undefined)
                event.start = moment();
            if (typeof event.end === "string")
                event.end = moment(event.end);
            else if (event.end === undefined)
                event.end = moment().add(30, "m");
        }
        //Shuffle array elements
        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        };
        function generateRoomName() {
            var charArray= ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
            var digitArray= ["0","1","2","3","4","5","6","7","8","9"];
            var roomName = shuffle(digitArray).join("").substring(0,3) + shuffle(charArray).join("").substring(0,7);
            return shuffle(roomName.split("")).join("");
        };
        const getDate = function(string)
        {
            string = string.split(" ");
            const date = string[0].split("/");
            const time = string[1].split(":");

            return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
        };
        const update_location = function()
        {
            if ($("#eb-mm-em-p")[0].checked)
            {
                //Si présentiel
                $("#edit-location").val($("#presential-cal-location").val());

            }
            else if ($("#eb-mm-em-v")[0].checked)
            {
                //Visio
                if ($("#eb-mm-wm-e")[0].checked)
                {
                    let config = {
                        _key:generateRoomName(),
                    };
                    if ($("#wsp-event-all-cal-mm").val() !== "#none")
                        config["_wsp"] = $("#wsp-event-all-cal-mm").val();
                    else
                        config["_ariane"] = "home";
                    $("#edit-location").val(`#visio:${mel_metapage.Functions.url("webconf", "", config)}`);
                }
                else
                    $("#edit-location").val(`@visio:${$("#url-visio-cal").val()}`);
            }
            else {
                //Audio
                $("#edit-location").val(`https://audio.mtes.fr/ : ${$("#tel-input-cal-location").val()} - ${$("#num-audio-input-cal-location").val()}`);
            }
        };
        const update_date = () => {
            let val = $(".input-mel-datetime .input-mel.start").val().split(" ");
            $("#edit-startdate").val(val[0]);
            $("#edit-starttime").val(val[1]);
            val = $(".input-mel-datetime .input-mel.end").val().split(" ");
            $("#edit-enddate").val(val[0]);
            $("#edit-endtime").val(val[1]);
        }
        const format = "DD/MM/YYYY HH:mm";
        const have_created_callback = $("#eventedit").data("callbacks") === "ok";
        if (!have_created_callback)
        {
            //Update datetime
            $(".input-mel-datetime .input-mel.start").datetimepicker({
                format: 'd/m/Y H:i',
                onChangeDateTime:() => {
                    let querry = $(".input-mel-datetime .input-mel.end");
                    const end_val = getDate(querry.val());
                    const start_val = getDate($(".input-mel-datetime .input-mel.start").val());

                    if (end_val === "" || end_val === undefined || end_val === null || end_val <= start_val)
                    {
                        querry.val(getDate($(".input-mel-datetime .input-mel.start").val()).add(1,"h").format(format) );
                        update_date();
                    }
                }
            });
            $(".input-mel-datetime .input-mel.end").datetimepicker({
                format: 'd/m/Y H:i',
                onChangeDateTime:() => {
                    let querry = $(".input-mel-datetime .input-mel.end");
                    const end_val = getDate(querry.val());
                    const start_val = getDate($(".input-mel-datetime .input-mel.start").val());

                    if (end_val === "" || end_val === undefined || end_val === null || end_val <= start_val)
                    {
                        querry.val(getDate($(".input-mel-datetime .input-mel.start").val()).add(1,"h").format(format) );
                        update_date();
                    }
                }
            });
            $(".input-mel-datetime .input-mel.start").on("change", () => {
                const val = $(".input-mel-datetime .input-mel.start").val().split(" ");
                $("#edit-startdate").val(val[0]);
                $("#edit-starttime").val(val[1]);
            });
            $(".input-mel-datetime .input-mel.end").on("change", () => {
                const val = $(".input-mel-datetime .input-mel.end").val().split(" ");
                $("#edit-enddate").val(val[0]);
                $("#edit-endtime").val(val[1]);
            });
            $("#edit-allday").on("click", (e) => {
                e = e.target;
                if (e.checked)
                {
                    $(".input-mel-datetime .input-mel.start").addClass("disabled").attr("disabled", "disabled"); 
                    $(".input-mel-datetime .input-mel.end").addClass("disabled").attr("disabled", "disabled"); 
                    $(".input-mel-datetime .input-mel.start").val(moment().startOf("day").format(format));
                    $(".input-mel-datetime .input-mel.end").val(moment().endOf("day").format(format));
                    update_date();
                }
                else
                {
                    $(".input-mel-datetime .input-mel.start").removeClass("disabled").removeAttr("disabled"); 
                    $(".input-mel-datetime .input-mel.end").removeClass("disabled").removeAttr("disabled"); 
                    update_date();
                }
            })
            //update locations
            $(".form-check-input.event-mode").on("click", (e) => {
                e = e.target;
                $(".content.event-mode").css("display", "none");
                $(`.${e.id}`).css("display", "");
                update_location();
            });
            $("#edit-location").on("change", () => {
                update_location();
            });
            $("#eb-mm-wm-e").on("change", () => {
                update_location();
                //console.log($("#eb-mm-wm-e")[0].checked, "checked");
                if (!$("#eb-mm-wm-e")[0].checked)
                    $("#url-visio-cal").removeClass("disabled").removeAttr("disabled");
                else
                    $("#url-visio-cal").addClass("disabled").attr("disabled", "disabled");
            });
            $("#eb-mm-wm-a").on("change", () => {
                update_location();
                //console.log($("#eb-mm-wm-e")[0].checked, "checked");
                if (!$("#eb-mm-wm-e")[0].checked)
                    $("#url-visio-cal").removeClass("disabled").removeAttr("disabled");
                else
                    $("#url-visio-cal").addClass("disabled").attr("disabled", "disabled");
            });
            $("#url-visio-cal").on("change", () => {
                update_location();
            });
            $("#presential-cal-location").on("change", () => {
                update_location();
            });
            $("#tel-input-cal-location").on("change", () => {
                update_location();
            });
            $("#tel-input-cal-location").on("change", () => {
                update_location();
            });
            $("#num-audio-input-cal-location").on("change", () => {
                update_location();
            });
            $("#edit-wsp").on("click", (e) => {
                e = e.target;
                if (e.checked)
                {
                    $("#div-events-wsp").css("display", "");
                    $("#div-events-category").css("display", "none");
                }
                else {
                    $("#div-events-wsp").css("display", "none");
                    $("#div-events-category").css("display", "");
                }
            });
            $("#wsp-event-all-cal-mm").on("change", () => {
                const val = $("#wsp-event-all-cal-mm").val();
                if (val !== "#none")
                    $("#edit-categories").val(`ws#${val}`)
                else
                    $("#edit-categories").val("");
                    update_location();
            });
            $("#categories-event-all-cal-mm").on("change", () => {
                const val = $("#categories-event-all-cal-mm").val();
                if (val !== "#none")
                    $("#edit-categories").val(val)
                else
                    $("#edit-categories").val("");
                $("#wsp-event-all-cal-mm").val("#none");
                update_location();
            });
            $("#fake-event-rec").on("change", (e) => {
                $("#edit-recurrence-frequency").val(e.target.value);
                $("#edit-recurrence-frequency").change();
            });
            //Update visu
            $("#edit-recurrence-frequency").addClass("input-mel");
            $("#edit-alarm-item").addClass("input-mel");
            $("#eventedit .form-check-input.custom-control-input").removeClass("custom-control-input");
            $("#edit-attendee-add").addClass("mel-button").css("margin", "0 5px");
            $("#edit-attendee-schedule").addClass("mel-button").css("margin", "0 5px");
            //ok
            $("#eventedit").data("callbacks", "ok");

        }
        
        setTimeout(() => {
            if (event === "") //nouvel event
            {
                $(".input-mel-datetime .input-mel.start").val(getDate(`${$("#edit-startdate").val()} ${$("#edit-starttime").val()}`).format(format));
                $(".input-mel-datetime .input-mel.end").val(getDate(`${$("#edit-startdate").val()} ${$("#edit-starttime").val()}`).add(30, 'm').format(format));
                update_date();
                if ($("#edit-wsp")[0].checked)
                {
                    $("#div-events-wsp").css("display", "");
                    $("#div-events-category").css("display", "none");
                }
                else {
                    $("#div-events-wsp").css("display", "none");
                    $("#div-events-category").css("display", "");
                }
                $("#fake-event-rec").val("")
            }
            else{ //ancien event
                $(".input-mel-datetime .input-mel.start").val(event.start.format(format));
                $(".input-mel-datetime .input-mel.end").val(event.end.format(format));
                update_date();

                const req = event.recurrence;
                if (req !== undefined && req !== null)
                {
                    $("#fake-event-rec").val(req.FREQ);
                }

                const description = event.location;
                if (description !== undefined)
                {
                    if (description.includes("https://audio.mtes.fr/ : "))
                    {
                        $("#eb-mm-em-a")[0].click();
                        const audio = description.replace("https://audio.mtes.fr/ : ", "").split(" - ");
                        $("#tel-input-cal-location").val(audio[0]);
                        $("#num-audio-input-cal-location").val(audio[1]);
                    }
                    else if (description.includes("#visio") || description.includes("@visio") )
                    {
                        const isRc = description.includes("#visio");
                        $("#eb-mm-em-v").click();
                        if (isRc)
                            $("#eb-mm-wm-e").click();
                        else
                        {
                            $("#eb-mm-wm-a").click();
                            $("#url-visio-cal").removeAttr("disabled").removeClass("disabled").val(description.replace("@visio:", ""));
                        }
                    }
                    else {
                        $("#eb-mm-em-p").click();
                        $("#presential-cal-location").val(description);
                    }
                }
                if (event.categories !== undefined && event.categories.length > 0)
                {
                    if (event.categories[0].includes("ws#"))
                    {
                        $("#edit-wsp")[0].checked = true;
                        $("#div-events-wsp").css("display", "");
                        $("#div-events-category").css("display", "none");
                        $("#wsp-event-all-cal-mm").val(event.categories[0].replace("ws#", ""));
                        if (event.calendar_blocked === "true")
                        {
                            $("#wsp-event-all-cal-mm").addClass("disabled").attr("disabled", "disabled");
                            $("#edit-wsp").addClass("disabled").attr("disabled", "disabled");
                        }
                    }
                    else
                    {
                        if ($("#edit-wsp")[0].checked)
                            $("#edit-wsp").click();
                        else {
                            $("#div-events-wsp").css("display", "none");
                            $("#div-events-category").css("display", "");
                        }
                        $("#categories-event-all-cal-mm").val(event.categories[0]);
                    }
                }
            }
        }, 10);
        //Suppression text
        $("#eventedit").find(".nav.nav-tabs").css("display", "none");
        $("#eventedit").find(".create_poll_link").css("display", "none");
        $("#edit-recurrence-frequency").parent().parent().find("label").css("display", "none");
        //maj des boutons
        let button_toolbar = $("#eventedit").parent().parent().find(".ui-dialog-buttonset");
        if (button_toolbar.length > 0)
        {
            button_toolbar.find(".btn").css("display", "none");
            // if (button_toolbar.find(".continue").length > 0)
            //     button_toolbar.find(".continue").css("display", "");
            // else
            // {
            //     button_toolbar.append(`<button class="btn btn-primary continue" onclick="rcube_calendar_ui.continue()">Continuer</button>`);
            //     button_toolbar.append(`<button style="display:none;" class="btn btn secondary back" onclick="rcube_calendar_ui.back()">Retour</button>`);
            // }
        }
    }
        rcmail.addEventListener("edit-event", (event) =>{
            window.rcube_calendar_ui.edit(event);
        });   

        rcmail.addEventListener("dialog-attendees-save", (datetimes) => {
            const getDate = function(string)
            {
                string = string.split(" ");
                const date = string[0].split("/");
                const time = string[1].split(":");
    
                return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
            };
            const format = "DD/MM/YYYY HH:mm";
            $(".input-mel-datetime .input-mel.start").val(getDate(`${datetimes.start.date} ${datetimes.start.time}`).format(format));
            $(".input-mel-datetime .input-mel.end").val(getDate(`${datetimes.end.date} ${datetimes.end.time}`).format(format));
        });

        rcmail.addEventListener("init", () => {
            rcmail.register_command('calendar-workspace-add-all', () => {
                mel_metapage.Functions.busy();
                mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "get_email_from_ws"), {
                    _uid:$("#wsp-event-all-cal-mm").val()
                }, (datas) => {
                    datas = JSON.parse(datas);
                    for (let index = 0; index < datas.length; ++index) {
                        const element = datas[index];
                        $("#edit-attendee-name").val(element);
                        $("#edit-attendee-add").click();
                    }
                }).always(() => {
                    mel_metapage.Functions.busy(false);
                });
            }, true);
        })

        // return;
        // new Promise(async (a,b) => {
        //     await wait(() => {
        //         console.log("para", rcube_calendar_ui.prototype.calendar_edit_dialog, window.calendar_edit_dialog);
        //         return rcube_calendar_ui.prototype.calendar_edit_dialog === undefined;
        //     });
        //     console.log("here", rcube_calendar_ui.prototype.calendar_edit_dialog);
        //     rcube_calendar_ui.prototype._calendar_edit_dialog = rcube_calendar_ui.prototype.calendar_edit_dialog;
        //     rcube_calendar_ui.prototype.calendar_edit_dialog = function(calendar)
        //     {
        //         console.log("parasite", calendar);
        //         this._calendar_edit_dialog(calendar);
        //         $(".input-mel-datetime").datetimepicker({
        //             format: 'd/m/Y H:i',
        //         });
    
        //     }
        // });
    

    rcube_calendar.prototype.create_event_from_somewhere = function(event = null)
    {
        if (event === null)
        {
            event = rcmail.local_storage_get_item("tmp_calendar_event");
        }

        var url = {
            _category: event === null || event.categories === undefined || event.categories === null || event.categories.length === 0 ? null : event.categories[0], 
            _framed: true,
            _calendar_blocked: event != null && event.calendar_blocked === true,
            // _startDate: event == null || event.start === undefined ? null : event.start,
            // _endDate: event == null || event.end === undefined ? null : event.end,
        },
            buttons = {},
            button_classes = ['mainaction save', 'cancel'],
            title = rcmail.gettext('mel_metapage.new_event'),
            dialog = $('<iframe>').attr({
                id: 'kolabcalendarinlinegui',
                name: 'kolabcalendardialog',
                src: rcmail.url('mel_metapage/dialog-ui', url)
            }).css("width", "100%").css("height", "100%");

        // // dialog buttons
        // buttons[rcmail.gettext('save')] = function() {
        //     var frame = rcmail.get_frame_window('kolabcalendarinlinegui');
        //     frame.rcmail.command('event-save');
        //     parent.postMessage({
        //         message:"update_calendar"
        //     });

        // };

        // buttons[rcmail.gettext('cancel')] = function() {
        //     dialog.dialog('destroy');
        // };

        // open jquery UI dialog
        // window.kolab_event_dialog_element = dialog = rcmail.show_popup_dialog(dialog, title, buttons, {
        //     button_classes: button_classes,
        //     minWidth: 500,
        //     width: 600,
        //     height: 600
        // });
        rcmail.lock_frame(dialog);
        const config = new GlobalModalConfig(`${event.from === "barup" ? '<span class="icon-mel-undo mel-return" onclick="m_mp_reinitialize_popup(() => {$(`iframe#kolabcalendarinlinegui`).remove();})"></span>' : ""}Créer un évènement`, "default", dialog, "");
        window.kolab_event_dialog_element = dialog = new GlobalModal("globalModal", config, true);
        window.kolab_event_dialog_element.autoHeight();
        window.kolab_event_dialog_element.onDestroy((globalModal) => {
            globalModal.contents.find("iframe").remove();
        });

    // var sheet = window.document.styleSheets[0];
    // sheet.insertRule('.ui-datepicker .ui-state-default, .ui-datepicker.ui-widget-content .ui-state-default { color: black!important; }', sheet.cssRules.length);
     };

     rcube_calendar.change_calendar_date = async function (jquery_element, add, where = null)
     {
         if (rcmail.busy)
            return;
         const config = {
            add_day_navigation:false,
            add_create:false,
            add_see_all:false
        };
         rcmail.set_busy(true, "loading");
         let date = moment(jquery_element.data("current-date"));
         console.log("change_calendar_date", "date", date);
         if (date === null || date === undefined || date === "")
            date = moment();
         date = date.add(add, "d").startOf("day");
         rcube_calendar.mel_metapage_misc.SetCalendarDate(jquery_element, date);
         console.log("change_calendar_date", "date-edited", date);
         const array = await rcube_calendar.block_change_date(jquery_element, add, where, date);
         if (array !== false)
         {
            console.log("change_calendar_date", "array", array);
            const html = html_helper.Calendars({datas:array,config:config, _date:date, get_only_body:true});
            console.log("change_calendar_date", "html", html);
            console.log("change_calendar_date", "rcube_calendar.mel_metapage_misc.GetAgenda", rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element));
            rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).html(html);
            jquery_element.data("current-date", date.format());
            console.log("change_calendar_date", "jquery_element", jquery_element);
         }
         rcmail.set_busy(false);
         rcmail.clear_messages();

     }

     rcube_calendar.block_change_date = async function (jquery_element, add, where = null, _date = null)
     {
        //const SetCalendarDate = rcube_calendar.mel_metapage_misc.SetCalendarDate;
        const GetAgenda = rcube_calendar.mel_metapage_misc.GetAgenda;
        const check = (x, item) => {x.uid === item.uid};
        //  const before = "ws#";
        //  const uid = rcmail.env.current_workspace_uid;
        //  const id = before + uid;
         const date = _date === null ? moment(jquery_element.data("current-date")).add(add, "d").startOf("day") : _date;
         //SetCalendarDate(jquery_element, date);
         if (jquery_element !== null)
            var querry = GetAgenda(jquery_element).html('<center><span class="spinner-border"></span></center>');
         const datas = await mel_metapage.Functions.update_calendar(date, moment(date).endOf("day"));
         let events = where === null || where === undefined ? JSON.parse(datas) : Enumerable.from(JSON.parse(datas)).where(where).toArray();
         //console.log("change_calendar_date",events, JSON.parse(datas));
         if (events !== null || events.length !== 0)
         {
             let element;
             let tmp;
             let array = [];
             let elementsToDelete = [];
             for (let index = 0; index < events.length; index++) {
                 element = events[index];
                 if (element.allDay)
                     element.order = 0;
                 else
                     element.order = 1;
                 tmp = mel_metapage.Functions.check_if_calendar_valid(element, events, false);
                 if (tmp === true)
                 {
                     const s = moment(element.start);
                     const e = moment(element.end);
                     const tmp_bool = (element.recurrence !== undefined || element.recurrence !== null) &&
                     s < date && e < date && element._instance === undefined
                     //console.log("block_change_date", index, element, (element.recurrence !== undefined || element.recurrence !== null), s < date, e < date, element._instance === undefined, "tmp_bool", tmp_bool);
                     if (tmp_bool)
                        tmp = element;
                 }

                 if (tmp === true)
                     array = Array.AddIfExist(array, check, element);
                 else if (tmp !== false)
                     elementsToDelete.push(tmp);
             }
             //console.log(array);
             events = Enumerable.from(array).where(x => !elementsToDelete.includes(x)).orderBy(x => x.order).thenBy(x => moment(x.start)).toArray();
             //setup_calendar(array, querry, date);
         }
         if (events === null || events.length === 0)
         {
            let _html;
            if (date === moment().startOf("day"))
                _html = "Pas de réunion aujourd'hui !";
            else
                _html = "Pas de réunion à cette date !";
            if (jquery_element !== null)
            {
                querry.html(_html);
                return false;
            }
            else
                return _html;
         }
         else
            return events;
     }

     rcube_calendar.mel_metapage_misc = {
        SetCalendarDate: function (jquery_element,date = null)
        {
            const now = date === null ? moment() : date;
            jquery_element.html(rcube_calendar.mel_metapage_misc.GetDate(now)).data("current-date", now);
        },
        GetParent: function(jquery_element)
        {
            return rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).parent();
        },
        GetAgenda : function (jquery_element)
        {
            return  jquery_element.parent().parent().parent().find(".block-body");
        },
        GetDate: function (momentObject)
        {
            return rcube_calendar.mel_metapage_misc.GetDateFr(momentObject.format("dddd DD MMMM"));
        },
        GetDateFr:function (date)
        {
            const capitalize = (s) => {
                if (typeof s !== 'string') return ''
                s = s.toLowerCase();
                return s.charAt(0).toUpperCase() + s.slice(1)
            }
            const arrayTransform = {
                "MONDAY":"LUNDI",
                "TUESDAY":"MARDI",
                "WEDNESDAY":"MERCREDI",
                "THURSDAY":"JEUDI",
                "FRIDAY":"VENDREDI",
                "SATURDAY":"SAMEDI",
                "SUNDAY":"DIMANCHE",
                "JANUARY":"JANVIER",
                "FEBRUARY":"FÉVRIER",
                "MARCH":"MARS",
                "APRIL":"AVRIL",
                "MAY":"MAI",
                "JUNE":"JUIN",
                "JULY":"JUILLET",
                "AUGUST":"AOÛT",
                "SEPTEMBER":"SEPTEMBRE",
                "OCTOBER":"OCTOBRE",
                "NOVEMBER":"NOVEMBRE",
                "DECEMBER":"DECEMBRE"
            }
            date = date.toUpperCase();
            for (const key in arrayTransform) {
                if (Object.hasOwnProperty.call(arrayTransform, key)) {
                    const element = arrayTransform[key];
                    if (date.includes(key))
                        date = date.replace(key, element);
                }
            }
            return capitalize(date);
        }

     }

     /**
      * Ouvre la fenêtre qui permet de créer un évènement.
      */
     rcube_calendar.mel_create_event = function()
     {
        const format = "DD/MM/YYYY HH:mm";
        const getDate = function(string)
        {
            string = string.split(" ");
            const date = string[0].split("/");
            const time = string[1].split(":");

            return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
        }

        var create_popUp = new GlobalModal();

        create_popUp = window.create_popUp;
         if (create_popUp === undefined)
            create_popUp = new GlobalModal();
        create_popUp.editTitle("Créer une réunion (étape 1/2)");
        create_popUp.editBody("<center><span class=spinner-border></span></center>");
        mel_metapage.Functions.get(mel_metapage.Functions.url("mel_metapage", "get_event_html"), mel_metapage.Symbols.null, (datas) => {
            create_popUp.editBody(datas);
            create_popUp.contents.find(".input-mel-datetime").datetimepicker({
                format: 'd/m/Y H:i',//'Y/m/d H:i',
                onChangeDateTime:() => {
                    let querry = $(".input-mel-datetime.end");
                    const end_val = getDate(querry.val());
                    const start_val = getDate($(".input-mel-datetime.start").val());
                    if (end_val === "" || end_val === undefined || end_val === null || end_val <= start_val)
                    querry.val(getDate($(".input-mel-datetime.start").val()).add(1,"h").format(format) );
                }
                    });
            create_popUp.contents.find(".input-mel-datetime.start").val(moment().format(format));
            create_popUp.contents.find(".input-mel-datetime.end").val(moment().add(1,"h").format(format));
            create_popUp.contents.find(".input-mel-datetime.audio").val(moment().add(30,"m").format(format));
            create_popUp.contents.find(".form-check-input.event-mode").on("click", (e) => {
                e = e.target;
                create_popUp.contents.find(".content.event-mode").css("display", "none");
                create_popUp.contents.find(`.${e.id}`).css("display", "");
            });
            create_popUp.contents.find("#eb-mm-all-day").on("click", (e) => {
                e = e.target;
                if (e.checked)
                {
                    create_popUp.contents.find(".input-mel-datetime.start").addClass("disabled").attr("disabled", "disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.end").addClass("disabled").attr("disabled", "disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.start").val(moment().startOf("day").format(format));
                    create_popUp.contents.find(".input-mel-datetime.end").val(moment().endOf("day").format(format));
                }
                else
                {
                    create_popUp.contents.find(".input-mel-datetime.start").removeClass("disabled").removeAttr("disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.end").removeClass("disabled").removeAttr("disabled"); 
                }
            })
            create_popUp.footer.querry.html(`
            <div style="margin-top:0" class="mel-button invite-button create" onclick="">
                <span>Continuer</span>
                <span class="icofont-arrow-right  plus" style="margin-left: 15px;"></span>
            </div>
            `)
            create_popUp.show();
        });
     }

});




/*



    class CalendarEvent
    {
        constructor()
        {
            this._id = "";
            this.id = "";
            this.uid = "";

            this.start = "";
            this.end = "";
            this.changed = '';
            this.created = "";

            this.title = "";
            this.description = "";
            this.location = "";

            this["calendar-name"] = "";
            this.calendar = "";

            this.free_busy = "";
            this.status = "";
            this.sensitivity = "";

            this.attachments = []

            this.vurl = null;
            this.allDay = false;

            this.className = [];

        }

        // add_attachments(...a)
        // {
        //     this.attachments = a;
        // }

        daily(interval, until)
        {
            this.recurrence = {
                FREQ:"DAILY",
                INTERVAL:interval,
                //UNTIL:until,
                EXTDATE:[]
            };
        }

        weekly(interval, byday, until)
        {
            this.recurrence = {
                FREQ:"DAILY",
                INTERVAL:interval,
                BYDAY:byday,
                EXTDATE:[]
            };  
        }

        monthly(interval, byday, until)
        {
            this.recurrence = {
                FREQ:"MONTHLY",
                INTERVAL:interval,
                BYMONTHDAY:byday,
                EXTDATE:[]
            };  
        }

        yearly(interval, BYmonth, until)
        {
            this.recurrence = {
                FREQ:"YEARLY",
                INTERVAL:interval,
                BYMONTH:BYmonth,
                EXTDATE:[]
            };  
        }
    }


*/