import { JsHtml } from './JsHtml.js';
export { JsHtml };

JsHtml.extend(
  'accessibilty_setup_button',
  function ({ isChild = false, return_child = false }) {
    let navigator = isChild ? this.childs[this.childs.length - 1] : this;
    navigator = navigator
      .attr('href', '#')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('onkeydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          console.log('click');
          $(event.target).click();
        }
      });

    return isChild ? (return_child ? navigator : this) : navigator;
  },
);

JsHtml.extend(
  'input_text_floating',
  function (
    label,
    { div_attribs = {}, label_attribs = {}, inputs_attribs = {} },
  ) {
    const id = inputs_attribs.id || generate_id();
    //prettier-ignore
    return this.div(div_attribs).addClass('form-floating pixel-correction')
                    .input_text(inputs_attribs).attr('id', id).attr('required', 'required')
                    .label(label_attribs).attr('for', id)
                        .text(label)
                    .end()
                .end();
  },
);

function generate_id() {
  let id;
  do {
    id = mel_metapage.Functions.generateWebconfRoomName();
  } while ($(`#${id}`).length > 0);

  return id;
}
