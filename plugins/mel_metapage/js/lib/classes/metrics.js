import { BnumLog } from "./bnum_log.js";

class Serialize {
    constructor() {
    }

    serialize() {}

    toString() {
        return this.serialize();
    }

}

class LookLabel extends Serialize {
    constructor({userid = '', service = ''}) {
        super();
        this.browser = navigator.userAgent;
        this.bowserName = this.get_browser();
        this.browserVersion = navigator.appVersion;
        this.platform = navigator.platform;
        this.language = navigator.language;
        this.isMobile = (/Mobi/.test(navigator.userAgent) || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0)).toString();
        this.userid = userid || rcmail.env.username;
        this.service = service || this._get_user_service();

        const screenWidth = window.screen.width; 
        const screenHeight = window.screen.height;
        const screenResolution = `${screenWidth}x${screenHeight}`;
        this.screen_resolution = screenResolution;
    }

    _get_user_service() {
        return rcmail.env.current_user.full.split('- ')[1];
    }

    serialize() {
        return JSON.stringify(this);
    }

    get_browser() {
        if (!LookLabel.browser) {
            function getBrowserType() {
                const test = regexp => {
                  return regexp.test(navigator.userAgent);
                };
              
                if (test(/opr\//i) || !!window.opr) {
                  return 'Opera';
                } else if (test(/edg/i)) {
                  return 'Microsoft Edge';
                } else if (test(/chrome|chromium|crios/i)) {
                  return 'Google Chrome';
                } else if (test(/firefox|fxios/i)) {
                  return 'Mozilla Firefox';
                } else if (test(/safari/i)) {
                  return 'Apple Safari';
                } else if (test(/trident/i)) {
                  return 'Microsoft Internet Explorer';
                } else if (test(/ucbrowser/i)) {
                  return 'UC Browser';
                } else if (test(/samsungbrowser/i)) {
                  return 'Samsung Browser';
                } else {
                  return 'Unknown browser';
                }
              }

              LookLabel.browser = getBrowserType();
        }

        return LookLabel.browser;
    }
}

class LookDatas extends Serialize {
    constructor({metric_name = '', metric_value = 1, labels = null}) {
        super();
        this.metric_name = metric_name;
        this.metric_value = metric_value;
        this.labels = labels || new LookLabel({});
    }

    serialize() {
        return JSON.stringify(this);
    }
}

export class Look {
    static async Send(name, value) {
        const lookData = new LookDatas({metric_name: name, metric_value: value});
        const config = {
            url: this.URL,
            type: 'POST',
            data: lookData.serialize(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.TOKEN}`
            },
            success(result) {
                BnumLog.info(`Résultat de la requête : ${JSON.stringify(result)}`);
            },
            error(result) {
                BnumLog.error('Erreur lors de l\'envoi de la métrique :', result);
            }
        };

        await $.ajax(config);
    }

    static async SendTask(task) {
        return await this.Send(`bnum_${task}`, 1);
    }
}

Look.URL = rcmail.env.mel_metrics_url;
Look.TOKEN = rcmail.env.mel_metrics_token;
Look.SEND_INTERVAL = rcmail.env.mel_metrics_send_interval;