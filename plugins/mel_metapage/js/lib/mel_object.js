export { MelObject };
import { Mel_Ajax } from "../../../mel_metapage/js/lib/mel_promise";
import { Cookie } from "./classes/cookies";

class MelObject {
    constructor(...args) {
        this.main(...args);
    }

    main(...args) {}

    rcmail(top = false) {
        return top ? window.top.rcmail : window.rcmail;
    }

    add_event_listener(key, callback, {top = false}) {
        this.rcmail(top).addEventListener(key, callback);
    }

    trigger_event(key, args, {top = false}){
        return this.rcmail(top).triggerEvent(key, args);
    }

    get_env(key) {
        return rcmail.env[key] ?? top?.rcmail?.env?.[key];
    }

    async change_frame(frame, {
        action = null,
        params = {},
        update = true,
        force_update = false
    }) {
        await mel_metapage.Functions.change_page(frame, action, params, update, force_update);
    }

    url(task, {action = EMPTY_STRING, params = null})
    {
        return mel_metapage.Functions.url(task, action, params);
    }

    http_call({url, on_success = () => {}, on_error = (...args) => {console.error('###[http_call]', ...args)}, params = null, type = 'POST'}){
        return new Mel_Ajax({
            type,
            url,
            success:on_success,
            failed:on_error,
            datas:params
        });
    }

    http_internal_call({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_call]', ...args)}, params = null, type = 'POST'}){
        return this.http_call({
            type,
            on_error,
            on_success, 
            params,
            url:this.url(task, action, (type === 'GET' ? params : null))
        })
    }

    http_internal_post({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_post]', ...args)}, params = null})
    {
        return this.http_internal_call({
            task,
            action,
            on_success,
            on_error,
            params,
            type:'POST'
        })
    }

    http_internal_get({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_post]', ...args)}, params = null})
    {
        return this.http_internal_call({
            task,
            action,
            on_success,
            on_error,
            params,
            type:'GET'
        })
    }

    save(key, contents) {
        mel_metapage.Storage.set(key, contents);
        return this;
    }

    load(key, default_value = null) {
        return mel_metapage.Storage.get(key, default_value);
    }

    get_skin() {
        return window.MEL_ELASTIC_UI;
    }

    select(selector) {
        return $(selector);
    }

    copy_to_clipboard(text) {
        mel_metapage.Functions.copy(text);
        return this;
    }

    cookie_set(key, name, expire = false) {
        return Cookie.set_cookie(key, name, expire);
    }

    cookie_get(key) {
        return Cookie.get_cookie(key);
    }

    cookie_remove(key) {
        return Cookie.remove_cookie(key);
    }
}
