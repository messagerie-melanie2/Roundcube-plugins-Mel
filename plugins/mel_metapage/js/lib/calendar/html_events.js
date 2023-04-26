export class html_events extends mel_html2 {
    constructor(event, attribs = {}) {
        super(CONST_HTML_DIV, {attribs});
        const date = STRING === typeof event.start ? moment(event.start) : event.start;
        const end_date = STRING === typeof event.end ? moment(event.end) : event.end;
        Object.defineProperties(this, {
            event: {
                get: function() {
                    return event;
                },
                configurable: true
            },
            date:{
                get: function() {
                    return date;
                },
                configurable: true
            },
            end_date:{
                get: function() {
                    return end_date;
                },
                configurable: true
            },
        });

        const content = this._create_content();
        Object.defineProperties(this, {
            content: {
                get: function() {
                    return content;
                },
                configurable: true
            }
        });
    }

    _create_content() {
        const html_date = new mel_html('div', {class:'melv2-event-date'}, this._date_format());
        const html_hour = new mel_html2('div', {attribs:{class:'melv2-event-hour'}, contents:this._create_range_hour()});
    }

    _create_range_hour() {
        const is_all_day = this.event.allDay;
        const top_content = is_all_day ? 'Journée' : 
        //const html_top_hour = new mel_html('span', {class:'melv2-event-hour-top'});
    }

    _create_event() {}

    _create_visio() {}

    _date_is({day_to_add = 0}) {
        return this.date.startOf('day').format() === moment().add(day_to_add, 'd').startOf('day').format();
    }
    _is_today() {
        const now = moment();
        return this.date <= now < this.end_date;
    }
    _is_tomorrow() {
        return this._date_is({day_to_add:1});
    }

    _date_format() {
        if (this._is_today()) return 'Aujourd\'hui';
        else if (this._is_tomorrow()) return 'Demain';
        else return this.date.format('DD/MM/YYYY');
    }

    _generateContent($html, content) {
		return $html.html(content);
	}
}