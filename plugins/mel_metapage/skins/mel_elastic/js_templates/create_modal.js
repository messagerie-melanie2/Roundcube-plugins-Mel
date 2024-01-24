import { MelHtml } from "../../../js/lib/html/JsHtml/MelHtml.js";
export {html as create_modale_template, zones}

const zones = {
    main:'main',
    top_left:'top-left',
    top_center:'top-center',
    top_right:'top-right',
    bottom_left_corner:'bottom-left-corner',
    bottom_left:'bottom-left',
    bottom_right:'bottom-right',
    bottom_right_corner:'bottom-right-corner',
};

const html = MelHtml.start
.div()
    .ul({id:'globallist', class:'row ignore-bullet'}).css('margin', '0')
        .li({class:'col-12', 'data-zones':'main', 'data-zone':zones.main})
        .end()
        .li({class:'col-md-4', 'data-zones':'center', 'data-zone':zones.top_left})
        .end()
        .li({class:'col-md-4', 'data-zones':'center', 'data-zone':zones.top_center})
        .end()
        .li({class:'col-md-4', 'data-zones':'center', 'data-zone':zones.top_right})
        .end()
        .li({class:'col-md-3', 'data-zones':'bottom', 'data-zone':zones.bottom_left_corner})
        .end()
        .li({class:'col-md-3', 'data-zones':'bottom', 'data-zone':zones.bottom_left})
        .end()
        .li({class:'col-md-3', 'data-zones':'bottom', 'data-zone':zones.bottom_right})
        .end()
        .li({class:'col-md-3', 'data-zones':'bottom', 'data-zone':zones.bottom_right_corner})
        .end()
    .end()
.end();