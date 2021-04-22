$(document).ready(() => {
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
            });

        // dialog buttons
        buttons[rcmail.gettext('save')] = function() {
            var frame = rcmail.get_frame_window('kolabcalendarinlinegui');
            frame.rcmail.command('event-save');
            parent.postMessage({
                message:"update_calendar"
            });

        };

        buttons[rcmail.gettext('cancel')] = function() {
            dialog.dialog('destroy');
        };

        // open jquery UI dialog
        window.kolab_event_dialog_element = dialog = rcmail.show_popup_dialog(dialog, title, buttons, {
            button_classes: button_classes,
            minWidth: 500,
            width: 600,
            height: 600
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
            const html = html_helper.Calendars(array,config, null, null, date, true);
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
                     array.AddIfExist(check, element);
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
            create_popUp.show();
        });
     }

});