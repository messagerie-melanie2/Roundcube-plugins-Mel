export class ModuleInitAgendaColor {
  constructor() {
    if (!CSS.supports('x: attr(x type(*))')) {
      this.#_apply();
    }
  }

  #_apply() {
    const calendars = document.querySelectorAll('#calendarslist [data-color]');

    for (const calendar of calendars) {
      calendar.style.setProperty(
        '--agenda-color',
        calendar.getAttribute('data-color'),
      );
    }
  }
}
