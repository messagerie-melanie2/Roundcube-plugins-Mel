export { EventLocation };

const NEWLINE = String.fromCharCode('8199');
const AUDIO_URL = 'https://audio.mtes.fr/';

class BaseLocation {
    constructor(location) {
        Object.defineProperties(this, {
            location: {
                get: function() {
                    return location;
                },
                configurable: true
            }
        });
    }

    side_action() { return false; }
}

class VisioLocation extends BaseLocation {
    constructor(location, categories = []) {
        super(location);
        const webconflink = WebconfLink.create({location, categories});
        Object.defineProperties(this, {
            key: {
                get: function() {
                    return webconflink.key;
                },
                configurable: true
            },
            ariane: {
                get: function() {
                    return webconflink.ariane;
                },
                configurable: true
            },            
            wsp: {
                get: function() {
                    return webconflink.wsp;
                },
                configurable: true
            },
        });
    }

    side_action() {
        return window.webconf_helper.go(this.key, this.wsp, this.ariane);
    }
}

class AudioLocation extends BaseLocation {
    constructor(location) {
        super(location);
        const splited = location.split(' - ');
        const [url, audio, pin] = [...splited[0].split(' : '), splited[1]];
        Object.defineProperties(this, {
            url: {
                get: function() {
                    return url;
                },
                configurable: true
            },
            audio: {
                get: function() {
                    return audio;
                },
                configurable: true
            },            
            pin: {
                get: function() {
                    return pin;
                },
                configurable: true
            },
        });
    }

    side_action() {
        return new mel_html('a', {href:`tel:${this.audio} ; ${this.pin}#`}).generate().click();
    }
}

class EventLocation extends BaseLocation {
    constructor(event) {
        super(event.location);
        let locations = event.location.split(NEWLINE);
        locations = this._generate_locations(locations, event);
        Object.defineProperties(this, {
            audio: {
                get: function() {
                    return locations.audio;
                },
                configurable: true
            },
            visio: {
                get: function() {
                    return locations.visio;
                },
                configurable: true
            },            
            locations: {
                get: function() {
                    return locations.locations ?? [];
                },
                configurable: true
            },
        });
    }

    _generate_locations(locations, event) {
        let new_locations = {
            audio:null,
            visio:null,
            locations:[]
        };
        for (let index = 0, len = locations.length, tmp; index < len; ++index) {
            const element = locations[index];
            
            if (element.includes(AUDIO_URL)) new_locations.audio = new AudioLocation(element);
            else {
                tmp = new VisioLocation(element, event.categories);
                if (!!(tmp.key || false)) new_locations.visio = tmp;
                else new_locations.locations.push(new BaseLocation(element));
                tmp = null;
            }
        }

        return new_locations;
    }

    has_visio() {
        return !!this.visio;
    }

    has_audio() {
        return !!this.audio;
    }

    has_locations() {
        return this.locations.length > 0;
    }

    has() {
        return this.has_visio() || this.has_audio() || this.has_locations();
    }

    *[Symbol.iterator]() {
        if (this.has_visio()) yield this.visio;

        if (this.has_audio()) yield this.audio;

        if (this.has_locations()) yield * this.locations;
    }
}

