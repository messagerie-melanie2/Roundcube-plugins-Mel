import { MelHtml } from "../../../js/lib/html/JsHtml/MelHtml.js";
export { html as custom_alarm_dialog }

const html = MelHtml.start
.div({id:'custom-alarm-dialog'})
    .div({class:'input-group'})
        .input_number({id:'custom-alarm-value', class:'form-control input-mel', value:1, placeholder:'Valeur'})
        .select({id:'custom-alarm-offset', class:'form-control input-mel'})
            .option({value:'-M'}).text('minutes avant').end()
            .option({value:'-H'}).text('heures avant').end()
            .option({value:'-D'}).text('jours avant').end()
            .option({value:'-W'}).text('semaines avant').end()
        .end()
    .end()
.end();