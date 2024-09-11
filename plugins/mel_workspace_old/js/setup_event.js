$(document).ready(() => {

    rcmail.addEventListener("init", () => {
        $("a.nav-link.nav-icon.resources").parent().remove();
        $("#edit-event-links").remove();

        const event = rcmail.env.event_prop;
        if (event.categories !== undefined && event.categories.length > 0)
            $("#edit-categories").val(event.categories[0]).attr("disabled", "disabled");
        if (event.calendar !== undefined)
        {

            $("#edit-calendar").val(event.calendar);
            if (event.calendar_blocked == "true")
                $("#edit-calendar").attr("disabled", "disabled");
        }

        let start;
        if (event.start !== undefined)
        {           
            if (event.start === "now")
                start = moment();
            else
                start = moment(event.start);
            $("#edit-startdate").val(start.format("DD/MM/YYYY"));
            $("#edit-starttime").val(start.format("HH:mm"));
        }
        if (event.end !== undefined)
        {
            let end;
            if (event.end === "start+1h")
                end = start.add(1, "h");
            else
                end = moment(event.end);
            $("#edit-enddate").val(end.format("DD/MM/YYYY"));
            $("#edit-endtime").val(end.format("HH:mm"));
        }
        

    });

    function create_event(start, end, title, description, calendar, calendar_name)
    {
        return {
            //"_id": "tommy_-P-_delphin_-P-_i:A07EF53A7C9566082F27BE193547674D-1EEAF6CD7566A99D@DATE-1612962000",
            "start": "2021-02-10T13:00:00+00:00",
            "end": "2021-02-11T14:00:00+00:00",
            //"changed": "2021-02-10T10:01:01+01:00",
            //"created": "2021-02-10T10:01:01+01:00",
            "title": "Télétravail",
            "description": "",
            "location": "",
            //"id": "A07EF53A7C9566082F27BE193547674D-1EEAF6CD7566A99D@DATE-1612962000",
            //"uid": "A07EF53A7C9566082F27BE193547674D-1EEAF6CD7566A99D",
            "calendar-name": "DELPHIN Tommy",
            "calendar": "tommy_-P-_delphin_-P-_i",
            "free_busy": "busy",
            "status": "CONFIRMED",
            "sensitivity": "public",
            //"attachments": [],
            // "recurrence": {
            //   "FREQ": "WEEKLY",
            //   "INTERVAL": "1",
            //   "BYDAY": "MO,TU,WE,TH,FR",
            //   "EXDATE": []
            // },
            //"recurrence_text": "Tous les 1 semaine(s), toujours",
            //"vurl": null,
            "allDay": true,
            //"className": [],
            //"order": 0
          }
    }

});