// import { BnumEvent } from '../../../mel_events';
// import { HtmlCustomTag } from './classes.js';

// export { InputFile };

// class InputFile extends HtmlCustomTag {
//   #accepts = EInputMode.all;

//   constructor({ accept = EInputMode.all } = {}) {
//     super();

//     this._init();
//     this.#accepts = accept;
//   }

//   _init() {
//     this.#accepts = null;
//     this.onfilesload = new BnumEvent();

//     return this;
//   }

//   _setup(accept) {
//     switch (accept) {
//       case EInputMode.image:
//         accept = 'image/*';
//         break;

//       case EInputMode.audio:
//         accept = 'video/*';
//         break;

//       case EInputMode.audio:
//         accept = 'audio/*';
//         break;

//       default:
//         if (this.dataset.accepts) {
//           accept = this.dataset.accepts;
//         } else accept = null;
//         break;
//     }

//     Object.defineProperty(this, '#accepts', {
//       value: accept,
//       configurable: false,
//       writable: false,
//     });

//     return this;
//   }

//   _main() {
//     this._setup(this.#accepts);

//     let component = this.attachShadow({ mode: 'open' });
//   }

//   connectedCallback() {
//     this._main();
//   }
// }

// const EInputMode = {
//   all: Symbol(),
//   image: Symbol(),
//   video: Symbol(),
//   audio: Symbol(),
//   custom: Symbol(),
// };
