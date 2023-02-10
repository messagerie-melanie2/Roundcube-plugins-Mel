class MelVideo {
    constructor(device, $main, width = 300, height = 200) {
        /**
         * @type {MediaDeviceInfo}
         */
        this.device = device;
        this.video = null;
        this.$parent = $main;
        this.started = false;
        /**
         * @type {MediaDeviceInfo[]}
         */
        this._all_devices = null;
        /**
         * @type {{width:number, height:number}}
         */
        this.size = {
            width,
            height
        }

        this.onclick = new MelEvent();
        /**
         * @type {MelEvent}
         */
        this.onbeforecreate = new MelEvent();
        this.oncreate = new MelEvent();
        this.ondispose = new MelEvent();
    }

    async create(devices = null) {
        if (!this.video) {
            if (!this._all_devices) this._all_devices = devices || await navigator.mediaDevices.enumerateDevices();

            await this.onbeforecreate.asyncCall(this);

            for (const d of this._all_devices) {
                if (d.kind === this.device.kind && d.label === this.device.label) {
                    this.video = $('<video autoplay></video>').click((event) => {
                        this.onclick.call(event, d, this.size);
                    }).css('width', `${this.size.width}px`).css('height', `${this.size.height}px`).appendTo(this.$parent)[0];
                    this.video.srcObject = await navigator.mediaDevices.getUserMedia({
                        video:{
                            deviceId:d.deviceId
                        }
                    });

                    await this.oncreate.asyncCall(this.video, d);

                    this.started = true;
                    break;
                }
            }
        }

        return this;
    }

    updateSize(w, h) {
        $(this.video).css('width', `${w}px`).css('height', `${h}px`);
        this.size.width = w;
        this.size.height = h;

        return this;
    }

    updateSizePerfect(w, h) {
        $(this.video).css('width', w).css('height', h);

        return this;
    }

    dispose() {
        if (!this.disposed) {
            this.disposed = true;

            if (!!this.video) {
                const tracks = this.video.srcObject.getTracks();

                for (const iterator of tracks) {
                    iterator.stop();
                }

                $(this.video).remove();
            }

            this.video = null;
            this.device = null;
            this.$parent = null;
            this.started = false;
            this._all_devices = null;
            this.size = null;
            this.onclick = null;
            this.onbeforecreate = null;
            this.oncreate = null;
            this.ondispose = null;
        }
    }
}


class MelVideoManager
{
    constructor() {
        this._devices = null;
        this._videos = {};
        this._size = 0;
    }

    /**
     * 
     * @param {*} $main 
     * @param {MediaDeviceInfo} device 
     */
    async addVideo($main, device, create = true, devices = null) {
        if (!this._devices) this._devices = devices || await navigator.mediaDevices.enumerateDevices();

        this._videos[device.deviceId] = new MelVideo(device, $main);

        if (create) await this._videos[device.deviceId].create(this._devices);

        ++this._size;

        return this;
    }

    async create() {
        await Promise.allSettled(Enumerable.from(this._videos).select(x => x.value.create(this._devices)).toArray());
        return this;
    }

    updateSize(w, h) {
        for (const key in this._videos) {
            if (Object.hasOwnProperty.call(this._videos, key)) {
                this._videos[key].updateSize(w, h);
            }
        }

        return this;
    }

    updateSizePerfect(w, h) {
        for (const key in this._videos) {
            if (Object.hasOwnProperty.call(this._videos, key)) {
                this._videos[key].updateSizePerfect(w, h);
            }
        }

        return this;
    }

    oncreate(callback) {
        for (const key in this._videos) {
            if (Object.hasOwnProperty.call(this._videos, key)) {
                this._videos[key].oncreate.push(callback);
            }
        }

        return this;
    }

    click(callback) {
        for (const key in this._videos) {
            if (Object.hasOwnProperty.call(this._videos, key)) {
                this._videos[key].onclick.push(callback);
            }
        }
    }

    count() {
        return this._size;
    }

    dispose() {
        if (!this.disposed) {
            this.disposed = true;

            this._devices = null;

            for (const key in this._videos) {
                if (Object.hasOwnProperty.call(this._videos, key)) {
                    this._videos[key].dispose();
                }
            }

            this._videos = null;
        }
    }
}

/**
 * 
 * @param {*} $main 
 * @param {MediaDeviceInfo[]} devices 
 */
async function generate_canvas($main, devices) {
    for (const d of devices) {
        if (d.kind === 'videoinput')
        {   
            navigator.mediaDevices.getUserMedia({
                video:{
                    deviceId:d.deviceId
                }
            }).then((stream) => {
                $('<video autoplay></video>').css('width', '300px').css('height', '200px').appendTo($main)[0].srcObject = stream;
            });


        }
    }
}

$(document).ready(async () => {
return;
const $main_div = $('#canvas-visualizer');    
const devices = await navigator.mediaDevices.enumerateDevices();
//generate_canvas($main_div, );
let manager = new MelVideoManager();


for (const d of await navigator.mediaDevices.enumerateDevices()) {
    if (d.kind === 'videoinput') manager.addVideo($main_div, d, false, devices);
}

manager.oncreate((video, device) => {
try {
    let $video = $(video);
    let $p = $(video).parent();
    let $div = $('<div></div>').css('width', 'fit-content').css('position', 'relative').click(() => {
        console.log('click', device, video);
    }).appendTo($p);

    $video.appendTo($div);

    $('<label></label>').html(device.label).appendTo($div);
} catch (error) {
    console.error('errror', error);
}

}).create();

});