// Load external calendar
if (window.rcmail) {
    rcmail.addEventListener('init', function() {
        document.querySelector('tr.external_calendar_url').style.display = 'none';

        // Checkbox 
        document.querySelector('#cfgexternalcalendarcheckbox').onchange = function() {
            if (this.checked) {
                document.querySelector('tr.external_calendar_url').style.display = '';
            } else {
                document.querySelector('tr.external_calendar_url').style.display = 'none';
            }
        }

        // Url input
        document.querySelector('#cfgexternalcalendarinput').onchange = function() {
            if (this.value && this.value.length > 0) {
                let validUrl = false;
                let services = [];
                for (const key in rcmail.env.external_calendars_url) {
                    if (Object.hasOwnProperty.call(rcmail.env.external_calendars_url, key)) {
                        services.push(key);
                        const re = new RegExp(rcmail.env.external_calendars_url[key]);
                        if (re.test(this.value)) {
                            validUrl = true;
                            break;
                        }
                    }
                }

                if (!validUrl) {
                    alert('Lien de calendrier invalide, la liste des services supportés est : ' + services.join(', '));
                    this.value = '';
                }
            }
        }
    });
}