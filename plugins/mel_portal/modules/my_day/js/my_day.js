function my_day(symbol = null)
{
	if (symbol === null || symbol === mel_metapage.Symbols.my_day.calendar)
		current_day(mel_metapage.Storage.calendar, mel_metapage.EventListeners.calendar_updated.get, setupMyDay);
	if (symbol === null || symbol === mel_metapage.Symbols.my_day.tasks)
		current_day(mel_metapage.Storage.tasks, mel_metapage.EventListeners.tasks_updated.get, setup_tasks);

}

function current_day(storage, trigger, setup_func = (local_storage) => { console.log(local_storage);})
{
	let local_storage = mel_metapage.Storage.get(storage);
	if (local_storage !== null)
	{
		//console.log(setup_func);
		setup_func(local_storage)}
	else{
		parent.rcmail.triggerEvent(trigger);
		return true;
	}
	return false;
}

Main.Add(my_day);
Update(my_day);

function setupMyDay(datas)
{
	const classes = {
		organizer:"icofont-royal royal",
		tick:"icofont-check lightgreen",
		waiting:"icofont-hour-glass clear",
		declined:"icofont-close danger"
	}
	let html = ''
	datas.sort(function(a,b){
		return moment(a.start) - moment(b.start);
	});
	let style;
	let bool;
	let icon;
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
        html += "<div class=col-md-8>" + moment(element.start).format('HH:mm') + " - " + moment(element.end).format('HH:mm') + "<br/>" + element.title +"</div>";
		bool = element.attendees !== undefined && 
			element.attendees.length > 0 && 
			Enumerable.from(element.attendees).any(x =>  rcmail.env.mel_metapage_user_emails.includes(x.email));
		if (bool)
		{
			icon = null;
			for (let it = 0; it < rcmail.env.mel_metapage_user_emails.length; it++) {
				const mail = rcmail.env.mel_metapage_user_emails[it];
				for (let j = 0; j < element.attendees.length; j++) {
					const attendee = element.attendees[j];
					if (attendee.email == mail)
					{
						if (attendee.role === "ORGANIZER")
							icon = classes.organizer;
						else if (attendee.status.toUpperCase() === 'CONFIRMED')
							icon = classes.tick;
						else if (attendee.status.toUpperCase() === 'DECLINED')
							icon = classes.declined;
						else 
							icon = classes.waiting;
						break;
					}
				}
				if (icon !== null)
					break;
			}
		}
        html += '<div class=col-md-2><a ' + (bool ? "" : 'style="display:none;') + ' class="roundbadge large ' + (icon !== null ? icon : "") + '"></a></div>';
		if (element.location.includes("http://") || element.location.includes("https://") || (element.vurl !== null && vurl !== ""))
			style = "";
		else
			style = "display:none;";
		html += '<div class=col-md-2><a target="_blank" style="'+style+'" href="'+element.location+'" class="roundbadge link large dark icofont-network"></a></div>';
        html += "</div>";
    }
    html += ""
	$("#agenda").html(html);
	if (datas.length > 0)
	{
		$("#agendanew").html(datas.length);
		$("#agendanew").removeClass("hidden");
	}
	else
		$("#agendanew").addClass("hidden");

		
}

function setup_tasks(datas)
{
	let html = ''
	// datas.sort(function(a,b){
	// 	return moment(a.start) - moment(b.start);
	// });
	datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
	let date;
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
        html += "<div class=col-md-10>" + element.title + "<br/>Créer le " + date.format("DD/MM/YYYY") + " à " + date.format("hh:mm") +"</div>";
		//html += '<div class=col-md-2><a style="display:none;" href=# onclick="removeEvent('+element.id+', '+element.calendar+')" class="roundbadge large dark icofont-trash"></a></div>';
        html += '<div class=col-md-2><a onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
        html += "</div>";
    }
    html += ""
	$("#tasks").html(html);
	if (datas.length > 0)
	{
		$("#tasksnew").html(datas.length);
		$("#tasksnew").removeClass("hidden");
	}
	else
		$("#tasksnew").addClass("hidden");
}
function add_task_to_completed(id)
{
	if (rcmail.busy)
		return;
	rcmail.set_busy(true, "loading");
	let local_storage = rcmail.local_storage_get_item(mel_metapage.Storage.tasks);
	if (local_storage != null)
	{
		let item = Enumerable.from(local_storage).firstOrDefault((x) => x.id === id, null);
		if (item !== null)
		{
			item.complete = 1;
			item.status = "COMPLETED";
		}
		$.ajax({ // fonction permettant de faire de l'ajax
		type: "POST", // methode de transmission des données au fichier php
		url: "?_task=tasks&_action=task", // url du fichier php
		data:{
			action:"edit",
			t:item,
			_remote:1,
			_unlock:0
		},
		success:  function (data) {
			rcmail.set_busy(false);
			rcmail.clear_messages();
			rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
		},
		error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
 
		},
	 });
	}
}

function removeEvent(id, calendarId)
{
	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "POST", // methode de transmission des données au fichier php
       url: rcmail.env.ev_remove_calendar_url, // url du fichier php
       data:{
           action:"remove",
           e:{
            id:id,
            calendar:calendarId
           },
           _remote:1,
           _unlock:0
       },
	   success: function (data) {
            my_day();
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response

	   },
	});
}

function dateNow(date){
	let set = date; 
	let getDate = set.getDate().toString();
	if (getDate.length == 1){ //example if 1 change to 01
	 getDate = "0"+getDate;
	}
	let getMonth = (set.getMonth()+1).toString();
	if (getMonth.length == 1){
	 getMonth = "0"+getMonth;
	}
	let getYear = set.getFullYear().toString();
	let dateNow = getYear + "-" + getMonth + '-' + getDate+"T00:00:00";
	return dateNow;
  }

  function selectTab(id, element)
  {
	  $(".tablinks").each((i,e) => {
		e.classList.remove("selected");
	  });
	  $(".tabcontent").each((i,e) => {
		e.classList.add("hidden");
	  });

	  element.classList.add("selected");
	  $("#" + id).removeClass("hidden");
	  setTimeout(() => {
		document.activeElement.blur();
	  }, 100);
  }

