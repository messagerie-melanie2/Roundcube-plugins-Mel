import { WspButton } from './button.js';

export class InvitMemberButton extends WspButton {
  constructor(parent = null) {
    super(parent);
  }

  _p_main() {
    super._p_main();

    this.onclick = () => {};
  }
}
