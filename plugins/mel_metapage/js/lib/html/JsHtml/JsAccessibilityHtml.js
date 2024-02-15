import { JsHtml } from "./JsHtml.js";
export { JsHtml }

JsHtml.extend('accessibilty_setup_button', function({isChild=false, return_child=false}) {
    let navigator = isChild ? this.childs[this.childs.length - 1] : this;
    navigator = navigator.attr('href', '#').attr('role', 'button').attr('tabindex', 0).attr('onkeydown', function (event) {
        if (
            (event.key === "Enter" ||
            event.key === " ")
        ) {
            console.log('click');
            $(event.target).click();
        }
    });

    return (isChild ? (return_child ? navigator : this ) : navigator);
});