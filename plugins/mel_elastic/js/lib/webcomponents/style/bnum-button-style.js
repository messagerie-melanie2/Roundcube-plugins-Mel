const style = `
:host {
    display: var(--bnum-button-display, inline-block);
    padding: var(--bnum-button-padding, 6px 10px);
    border-radius: var(--bnum-button-border-radius, 200px);
    cursor: var(--bnum-button-cursor, pointer);
}

:host(:state(square)) {
    border-radius: var(--bnum-button-square-border-radius, 10px);
}

:host(:state(without-icon)) {
    padding-top: var(--bnum-button-without-icon-padding-top, 7.5px);
    padding-bottom: var(--bnum-button-without-icon-padding-bottom, 7.5px);
}

:host(:state(primary)) {
    background-color: var(--bnum-button-background-color, #363a5b);
    color: var(--bnum-button-text-color, white);
    border: var(--bnum-button-border, solid thin var(--bnum-button-border-color));
}

:host(:state(primary):hover) {
    background-color: var(--bnum-button-hover-background-color, #484d7a);
    color: var(--bnum-button-hover-text-color, white);
    border: var(--bnum-button-hover-border, solid thin var(--bnum-button-hover-border-color));
}

:host(:state(primary):active) {
    background-color: var(--bnum-button-active-background-color, #2b2e49);
    color: var(--bnum-button-active-text-color, white);
    border: var(--bnum-button-active-border, solid thin var(--bnum-button-active-border-color));
}

:host(:state(secondary)) {
    background-color: var(--bnum-button-secondary-background-color, #f6f6f6);
    color: var(--bnum-button-secondary-text-color, #363a5b);
    border: var(--bnum-button-secondary-border, solid thin var(--bnum-button-secondary-border-color));
}

:host(:state(secondary):hover) {
    background-color: var(--bnum-button-secondary-hover-background-color,white);
    color: var(--bnum-button-secondary-hover-text-color, white);
    border: var(--bnum-button-secondary-hover-border, solid thin var(--bnum-button-secondary-hover-border-color));
}

:host(:state(secondary):active) {
    background-color: var(--bnum-button-secondary-active-background-color, #d9d9d9);
    color: var(--bnum-button-secondary-active-text-color, white);
    border: var(--bnum-button-secondary-active-border, solid thin var(--bnum-button-secondary-active-border-color));
}

:host(:state(danger)) {
    background-color: var(--bnum-button-danger-background-color, #fc945a);
    color: var(--bnum-button-danger-text-color, white);
    border: var(--bnum-button-danger-border, solid thin var(--bnum-button-danger-border-color));
}

:host(:state(danger):hover) {
    background-color: var(--bnum-button-danger-hover-background-color, #f7ab82);
    color: var(--bnum-button-danger-hover-text-color, white);
    border: var(--bnum-button-danger-hover-border, solid thin var(--bnum-button-danger-hover-border-color));
}

:host(:state(danger):active) {
    background-color: var(--bnum-button-danger-active-background-color, #fb6817);
    color: var(--bnum-button-danger-active-text-color, white);
    border: var(--bnum-button-danger-active-border, solid thin var(--bnum-button-danger-active-border-color));
}

:host(:state(loading):state(without-icon-loading)) slot {
    display: none;
}

:host(:state(disabled)) {
    cursor: not-allowed;
    opacity: var(--button-disabled-opacity, 0.6);
    pointer-events: var(--bnum-button-disabled-pointer-events, none);
}

:host(:state(disabled):state(loading)) {
    cursor: progress;
}

:host > .wrapper {
    display: var(--bnum-button-wrapper-display, flex);
    align-items: var(--bnum-button-wrapper-align-items, center);
}

:host bnum-icon.icon {
    display: var(--bnum-button-icon-display, flex);
    margin-%0: %1; /*var(--bnum-button-icon-margin-%0, 20px);*/
}

:host bnum-icon.loader {
    display: var(--bnum-button-loader-display, flex);
}

:host .spin,
:host .loader,
:host(:state(loading)) .icon {
    animation: spin var(--bnum-button-spin-duration, 0.75s) var(--bnum-button-spin-timing, linear) var(--bnum-button-spin-iteration, infinite);
}

:host-context(html.touch) :host(:state(hide-text-on-touch)) > .wrapper,
:host-context(html.layout-phone) :host(:state(hide-text-on-small)) > .wrapper,
:host-context(html.layout-small) :host(:state(hide-text-on-small)) > .wrapper {
    display:none;
}

:host-context(html.touch) :host(:state(hide-text-on-touch)) .icon,
:host-context(html.layout-small) :host(:state(hide-text-on-small)) .icon,
:host-context(html.layout-phone) :host(:state(hide-text-on-small)) .icon {
    margin-right: 0!important;
    margin-left: 0!important;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}
`;
export default style;
