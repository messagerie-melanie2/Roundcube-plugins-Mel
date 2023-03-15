async function get_status() {
    let status_datas = {
        status:undefined,
        message:''
    }
    await mel_metapage.Functions.get(
        mel_metapage.Functions.url('discussion', 'get_status'),
        {},
        (datas) => {
            if ("string" === typeof datas) datas = JSON.parse(datas);
            console.log('datas', datas);
            status_datas.status = datas.content.status;
            status_datas.message = datas.content.message || '';
        }
    );

    return status_datas;
}

async function set_status(status, message) {
    await mel_metapage.Functions.post(
        mel_metapage.Functions.url('discussion', 'set_status'),
        {
            _st:status,
            _msg:message
        },
        (datas) => {
            if ("string" === typeof datas) datas = JSON.parse(datas);

            console.log("test", datas);
        }
    );
}
$(document).ready(() => {

    console.log('start', rcmail.env.task);
    if (rcmail.env.task === 'rotomecatest') {
        get_status();
    }
});