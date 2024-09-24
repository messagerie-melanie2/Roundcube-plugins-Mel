import { BnumEvent } from '../../../mel_events.js';
import { MelObject } from '../../../mel_object.js';
import { HtmlCustomTag } from './classes.js';

export class AvatarElement extends HtmlCustomTag {
  constructor() {
    super();

    this._email = null;
    this.onimgload = new BnumEvent();
    this.onimgloaderror = new BnumEvent();

    this.onimgload.push((...args) => {
      this.dispatchEvent(new CustomEvent('api:imgload', { detail: args }));
    });

    this.onimgloaderror.push((...args) => {
      this.dispatchEvent(new CustomEvent('api:imgloaderror', { detail: args }));
    });
  }

  connectedCallback() {
    Object.defineProperty(this, '_email', {
      value:
        this.dataset.email || rcmail?.env?.mel_metapage_user_emails?.[0] || '?',
    });

    this.removeAttribute('data-email');

    if (!this.dataset.forceload) this.setAttribute('data-needcreation', true);

    this.style.display = 'block';

    let shadow = this.attachShadow({ mode: 'open' });

    let img = document.createElement('img');
    img.src = 'skins/elastic/images/contactpic.svg';

    let style = document.createElement('style');
    style.append(
      document.createTextNode(`
      img {
        filter: blur(0.2em);
        transition: filter 0.5s;
        object-fit: cover;
        border: var(--avatar-border);
        border-radius: 100%;
        width:100%;
        height:100%;
        box-sizing: var(--avatar-box-sizing);
      }
      `),
    );

    shadow.append(style, img);

    img = null;
    style = null;

    if (this.dataset.forceload) {
      setTimeout(() => {
        this.update_img();
        this.removeAttribute('data-forceload');
      }, 10);
    }
  }

  update_img() {
    let img = this.shadowRoot.querySelector('img');
    img.onload = this._on_load.bind(this);
    img.onerror = this._on_error.bind(this);
    img.src = MelObject.Empty().url('mel_metapage', {
      action: 'avatar',
      params: {
        _email: this._email,
      },
    });

    img = null;
  }

  _on_load() {
    this.removeAttribute('data-needcreation');

    let style = document.createElement('style');
    style.append(
      document.createTextNode(`
      img {
        filter: blur(0)!important;
        --avatar-border: var(--avatar-border-loaded)!important;
        --avatar-box-sizing: var(--avatar-box-sizing-loaded)!important;
      }
      `),
    );

    this.shadowRoot.append(style);
    style = null;

    let img = this.shadowRoot.querySelector('img');
    img.onload = null;
    img.onerror = null;

    this.onimgload.call(img, this);

    return this;
  }

  _on_error() {
    let error_data = this.onimgloaderror.call(this);

    if (Array.isArray(error_data)) {
      for (const element of error_data) {
        if (element.stop === true) return this;
      }
    } else if (error_data && error_data.stop === true) return this;

    const txt = this._email;
    this.shadowRoot.querySelector('img').remove();
    this.shadowRoot.querySelector('style').remove();

    let element = document.createElement('span');
    element.classList.add('no-picture');

    let span = document.createElement('span');
    span.appendChild(
      document.createTextNode(txt.substring(0, 1).toUpperCase()),
    );
    span.classList.add('absolute-center');

    element.appendChild(span);

    let style = document.createElement('style');
    style.append(
      document.createTextNode(`
      .absolute-center {
          margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translateY(-50%) translateX(-50%);
    transform: translateY(-50%) translateX(-50%);
    font-size: xx-large;
    color: var(--mel-button-text-color);
    }

    .no-picture {
    position:relative;
    display: block;
width: 100%;
height: 100%;
    }
      `),
    );

    this.shadowRoot.append(style, element);

    element = null;
    span = null;
    style = null;

    return this;
  }
}

{
  const TAG = 'bnum-avatar';

  if (!customElements.get(TAG)) customElements.define(TAG, AvatarElement);
}

window.addEventListener('load', function () {
  onLoaded();
});

function onLoaded() {
  let imagesToLoad = document.querySelectorAll(
    'bnum-avatar[data-needcreation]',
  );

  for (const image of imagesToLoad) {
    image.update_img();
  }
}
